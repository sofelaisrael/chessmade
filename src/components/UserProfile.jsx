import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import defaultimg from "../assets/default.png";

const UserProfile = ({ profile }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center space-x-4">
        <img
          src={profile.avatar || defaultimg}
          alt={profile.username}
          className="w-16 h-16 rounded-full"
        />
        <div>
          <h2 className="text-xl font-semibold">{profile.username}</h2>
          {/* <p className="text-gray-600">{profile.status || 'No status'}</p> */}
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <p className="text-sm text-gray-600">
          Joined: {formatDistanceToNow(profile.joined * 1000)} ago
        </p>
      </div>
    </div>
  );
}

export default UserProfile;