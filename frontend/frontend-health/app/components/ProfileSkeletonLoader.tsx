import React from "react";

export default function ProfileSkeletonLoader() {
  return (
    <div
      role="status"
      className="absolute bottom-full left-0 right-0 mx-4 mb-2 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden max-w-sm"
    >
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="space-y-2 flex-1">
            <div className="h-3 w-3/4 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-2 w-1/2 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-2 w-1/3 bg-gray-100 rounded-full"></div>
            <div className="h-3 w-full bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-2 w-1/3 bg-gray-100 rounded-full"></div>
            <div className="h-3 w-full bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-2 w-1/3 bg-gray-100 rounded-full"></div>
            <div className="h-3 w-full bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-2 w-1/3 bg-gray-100 rounded-full"></div>
            <div className="h-3 w-full bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-2 w-1/3 bg-gray-100 rounded-full"></div>
          <div className="h-3 w-full bg-gray-200 rounded-full animate-pulse"></div>
        </div>

        <div className="space-y-2">
          <div className="h-2 w-1/3 bg-gray-100 rounded-full"></div>
          <div className="h-3 w-full bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="border-t border-gray-100 p-2 bg-gray-50">
        <div className="h-8 w-full bg-gray-200 rounded-md animate-pulse"></div>
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  );
}
