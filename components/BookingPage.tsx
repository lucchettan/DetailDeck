import React from 'react';
import BookingFlow from './booking/BookingFlow';

interface BookingPageProps {
  shopId: string;
}

const BookingPage: React.FC<BookingPageProps> = ({ shopId }) => {
  return <BookingFlowNew shopId={shopId} />;
};

export default BookingPage;
