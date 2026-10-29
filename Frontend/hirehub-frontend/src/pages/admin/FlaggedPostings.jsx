import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { CardSkeleton } from '../../components/ui/Spinner';

export default function FlaggedPostings() {
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState(''); // Bug #22 fixed — was swallowed silently
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.get('/admin/flagged-jobs');
        setPostings(res.data.flagged_jobs || res.data || []);
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Failed to load flagged postings. Please refresh.');
        setPostings([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleAction = async (postId, action) => {
    setProcessing(true);
    setActionError('');
    try {
      await axiosInstance.post(`/admin/flagged-jobs/${postId}/${action}`);
      setPostings((prev) =>
        prev.map((p) =>
          (p._id || p.id) === postId ? { ...p, review_status: action } : p
        )
      );
      setReviewModal(null);
    } catch (err) {
      // Bug #22 fixed — surface the error instead of swallowing it
      setActionError(err.response?.data?.message || `Failed to ${action} posting. Please try again.`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Flagged Postings</h1>
        <p className="text-slate-500 mt-1">Review AI-flagged job postings for policy violations.</p>
      </div>

      {fetchError && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700 flex items-center justify-between">
          <span>{fetchError}</span>
          <button onClick={() => setFetchError('')} className="text-xs font-bold text-danger-800 hover:underline">Dismiss</button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-xs font-bold text-danger-800 hover:underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : postings.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">All clear!</h3>
          <p className="text-sm text-slate-500">No flagged postings require review at this time.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {postings.map((post) => (
            <Card key={post._id || post.id} padding="md" hover>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-slate-800">{post.title}</h3>
                    <Badge variant="warning" size="sm">
                      {post.flag_reason || 'AI Flagged'}
                    </Badge>
                    {post.review_status && post.review_status !== 'pending' && (
                      <Badge
                        variant={post.review_status === 'approved' ? 'success' : 'danger'}
                        size="sm"
                      >
                        {post.review_status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mb-2">
                    Posted by <strong>{post.company || post.employer_name}</strong>
                    {post.created_at && <> on {new Date(post.created_at).toLocaleDateString()}</>}
                  </p>
                  {post.flag_details && (
                    <div className="p-3 bg-warn-50 border border-warn-200 rounded-lg text-sm text-warn-700 mb-3">
                      <strong>AI Flag:</strong> {post.flag_details}
                    </div>
                  )}
                  <p className="text-sm text-slate-600 line-clamp-3">{post.description}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setReviewModal(post)}
                  >
                    Review
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction(post._id || post.id, 'approved')}
                    disabled={post.review_status === 'approved'}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleAction(post._id || post.id, 'rejected')}
                    disabled={post.review_status === 'rejected'}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review modal */}
      <Modal
        open={!!reviewModal}
        onClose={() => setReviewModal(null)}
        title="Review Flagged Posting"
        size="lg"
      >
        {reviewModal && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800 text-lg">{reviewModal.title}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {reviewModal.company || reviewModal.employer_name} • {reviewModal.location}
              </p>
            </div>

            {reviewModal.flag_details && (
              <div className="p-3 bg-warn-50 border border-warn-200 rounded-lg text-sm text-warn-700">
                <strong>Reason for flagging:</strong> {reviewModal.flag_details}
              </div>
            )}

            <div className="max-h-64 overflow-y-auto text-sm text-slate-600 whitespace-pre-line border border-slate-200 rounded-lg p-4">
              {reviewModal.description}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setReviewModal(null)}>
                Close
              </Button>
              <Button
                onClick={() => handleAction(reviewModal._id || reviewModal.id, 'approved')}
                loading={processing}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                onClick={() => handleAction(reviewModal._id || reviewModal.id, 'rejected')}
                loading={processing}
              >
                Remove Posting
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
