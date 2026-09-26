import ReviewsSection from './ReviewsSection';

// Packages now share the generic reviews block used by hotels, restaurants, cruises and trips.
export default function PackageReviewsSection({ packageId, onReviewAdded }) {
  return <ReviewsSection entityKey="package_id" entityId={packageId} onReviewAdded={onReviewAdded} />;
}
