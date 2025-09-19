import React from 'react';

const SkeletonCard: React.FC = () => (
    <div className="bg-white rounded-lg shadow-md border-transparent flex flex-col overflow-hidden">
        <div className="h-40 w-full bg-gray-200"></div>
        <div className="p-4 flex flex-col flex-grow">
            <div className="flex-grow">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mt-4"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mt-1"></div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
        </div>
    </div>
);

const BookingPageSkeleton: React.FC = () => {
    return (
        <div className="animate-pulse">
            {/* Header Skeleton */}
            <header className="relative h-48 bg-gray-200">
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
                <div className="absolute top-0 left-0 right-0 p-6 md:p-8 container mx-auto">
                    <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                    <div className="mt-2 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                    </div>
                </div>
            </header>
            
            {/* Main Content Skeleton */}
            <main className="container mx-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="h-7 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BookingPageSkeleton;
