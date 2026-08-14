import React, { useState } from 'react';
import { Camera, Video, Upload, Trash2, Image as ImageIcon, Film, Play } from 'lucide-react';

const PropertyMediaUploader = ({ photos = [], videos = [], onChange, compact = false }) => {
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'videos'

  // Handle Photo File Upload
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newPhotoUrl = event.target.result;
        onChange({
          photos: [...photos, newPhotoUrl],
          videos
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Handle Video File Upload
  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newVideoUrl = event.target.result;
        onChange({
          photos,
          videos: [...videos, newVideoUrl]
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Remove Media Item
  const handleRemovePhoto = (index) => {
    const updated = [...photos];
    updated.splice(index, 1);
    onChange({ photos: updated, videos });
  };

  const handleRemoveVideo = (index) => {
    const updated = [...videos];
    updated.splice(index, 1);
    onChange({ photos, videos: updated });
  };

  return (
    <div className={compact ? "p-5 border border-color rounded-[14px] bg-surface/40 space-y-5" : "card p-7 border border-color rounded-[16px] bg-card space-y-6 shadow-sm"}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={compact ? "text-[18px] font-bold text-main" : "text-[22px] font-bold text-main tracking-tight"}>
            5. Property Photos &amp; Videos
          </h2>
          <p className="text-[14px] text-muted mt-0.5">
            Optionally add photos or short videos showing the property, house compound, plantation or trees.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-color text-[13px]">
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'photos'
                ? 'bg-emerald text-dark shadow'
                : 'text-muted hover:text-main'
            }`}
          >
            <ImageIcon size={14} /> Upload Photos ({photos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'videos'
                ? 'bg-emerald text-dark shadow'
                : 'text-muted hover:text-main'
            }`}
          >
            <Film size={14} /> Upload Videos ({videos.length})
          </button>
        </div>
      </div>

      {/* Upload Dropzone */}
      {activeTab === 'photos' ? (
        <div className="space-y-4">
          <div className={`border-2 border-dashed border-color hover:border-emerald/60 rounded-[14px] ${compact ? 'p-5 min-h-[130px]' : 'p-8 min-h-[170px]'} bg-surface/50 text-center flex flex-col items-center justify-center transition-all`}>
            <input
              type="file"
              accept="image/*"
              multiple
              id={`photo-upload-input-${compact ? 'compact' : 'full'}`}
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <label
              htmlFor={`photo-upload-input-${compact ? 'compact' : 'full'}`}
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-emerald/15 border border-emerald/30 flex items-center justify-center text-emerald">
                <Upload size={20} />
              </div>
              <span className="text-[15px] font-bold text-main">
                Click or drag files here to upload property photos
              </span>
              <span className="text-[13px] text-muted">
                Supports JPG, PNG, WEBP files showing land, boundary, or tree stock (Multiple allowed)
              </span>
            </label>
          </div>

          {/* Photos Grid Gallery */}
          {photos.length > 0 && (
            <div className="pt-1">
              <span className="text-[13px] font-bold text-main block mb-2">
                Attached Property Photos ({photos.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative group h-24 rounded-[10px] overflow-hidden border border-color bg-dark">
                    <img src={url} alt={`Property Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald text-dark text-[9px] font-bold shadow">
                        Cover Photo
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-all opacity-90 group-hover:opacity-100"
                      title="Remove Photo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Videos Tab */
        <div className="space-y-4">
          <div className={`border-2 border-dashed border-color hover:border-emerald/60 rounded-[14px] ${compact ? 'p-5 min-h-[130px]' : 'p-8 min-h-[170px]'} bg-surface/50 text-center flex flex-col items-center justify-center transition-all`}>
            <input
              type="file"
              accept="video/*"
              multiple
              id={`video-upload-input-${compact ? 'compact' : 'full'}`}
              className="hidden"
              onChange={handleVideoUpload}
            />
            <label
              htmlFor={`video-upload-input-${compact ? 'compact' : 'full'}`}
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-emerald/15 border border-emerald/30 flex items-center justify-center text-emerald">
                <Video size={20} />
              </div>
              <span className="text-[15px] font-bold text-main">
                Click to upload video clips of your property
              </span>
              <span className="text-[13px] text-muted">
                Supports MP4, WEBM clips showing property access and trees
              </span>
            </label>
          </div>

          {/* Videos List Gallery */}
          {videos.length > 0 && (
            <div className="pt-1">
              <span className="text-[13px] font-bold text-main block mb-2">
                Attached Video Clips ({videos.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {videos.map((url, idx) => (
                  <div key={idx} className="relative group rounded-[10px] overflow-hidden border border-color bg-dark p-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald/20 border border-emerald flex items-center justify-center text-emerald">
                        <Play size={16} />
                      </div>
                      <div>
                        <span className="text-[13px] font-semibold text-main block">Video Clip #{idx + 1}</span>
                        <span className="text-[11px] text-muted block">Property walk-through clip</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(idx)}
                      className="p-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                      title="Remove Video"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyMediaUploader;
