import React from 'react';
import BookingFlowNew from './booking/BookingFlowNew';

interface BookingPageProps {
  shopId: string;
}

const BookingPage: React.FC<BookingPageProps> = ({ shopId }) => {
  return <BookingFlowNew shopId={shopId} />;
};

export default BookingPage;
