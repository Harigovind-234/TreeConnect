import React, { useState } from 'react';
import { Camera, Video, Upload, Trash2, Image as ImageIcon, Film, Play } from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';

const PropertyMediaUploader = ({ photos = [], videos = [], onChange, compact = false }) => {
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'videos'
  const [uploadError, setUploadError] = useState('');

  // Handle Photo File Upload
  const handlePhotoUpload = async (e) => {
    setUploadError('');
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const compressedPhotos = [];
    for (const file of files) {
      try {
        const compressed = await compressImage(file, 1024, 0.75);
        if (compressed) {
          compressedPhotos.push(compressed);
        }
      } catch (err) {
        console.error('Error compressing property photo:', err);
      }
    }

    if (compressedPhotos.length > 0) {
      onChange({
        photos: [...photos, ...compressedPhotos],
        videos
      });
    }
    e.target.value = '';
  };

  // Handle Video File Upload with Async Batching & Size Safeguards
  const handleVideoUpload = async (e) => {
    setUploadError('');
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newVideos = [];
    for (const file of files) {
      // 25MB limit per video to protect browser memory and payload limits
      if (file.size > 25 * 1024 * 1024) {
        setUploadError(`Video "${file.name}" exceeds the 25MB limit. Please upload shorter video clips.`);
        continue;
      }
      try {
        const videoDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        if (videoDataUrl) {
          newVideos.push(videoDataUrl);
        }
      } catch (err) {
        console.error('Error reading property video clip:', err);
      }
    }

    if (newVideos.length > 0) {
      onChange({
        photos,
        videos: [...videos, ...newVideos]
      });
    }
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
    <div className={compact ? "ld-subcard space-y-5 bg-[#09150d] border border-emerald-500/20 rounded-xl p-5" : "ld-card p-6 sm:p-8 space-y-6 shadow-2xl bg-[#0b1710] border border-emerald-500/20 rounded-xl"}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-emerald-500/20">
        <div>
          <h2 className={compact ? "text-base font-bold text-white" : "text-xl sm:text-2xl font-black text-white flex items-center gap-2.5 tracking-tight"}>
            5. Property Photos &amp; Videos
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
            Optionally add photos or short videos showing the property, house compound, plantation or trees.
          </p>
          {uploadError && (
            <p className="text-xs text-red-400 mt-1 font-semibold">{uploadError}</p>
          )}
        </div>

        <div className="flex items-center gap-2 bg-[#050e08] p-1 rounded-lg border border-emerald-600/30 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon size={14} /> Upload Photos ({photos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'videos'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film size={14} /> Upload Videos ({videos.length})
          </button>
        </div>
      </div>

      {/* Upload Dropzone */}
      {activeTab === 'photos' ? (
        <div className="space-y-4">
          <div className={`border-2 border-dashed border-emerald-600/30 hover:border-emerald-500/60 rounded-lg ${compact ? 'p-5 min-h-[130px]' : 'p-8 min-h-[170px]'} bg-[#050e08] text-center flex flex-col items-center justify-center transition-all`}>
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
              <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                <Upload size={20} />
              </div>
              <span className="text-sm font-bold text-white">
                Click or drag files here to upload property photos
              </span>
              <span className="text-xs text-slate-400">
                Supports JPG, PNG, WEBP files showing land, boundary, or tree stock (Multiple allowed)
              </span>
            </label>
          </div>

          {/* Photos Grid Gallery */}
          {photos.length > 0 && (
            <div className="pt-1">
              <span className="text-xs font-bold text-slate-300 block mb-2">
                Attached Property Photos ({photos.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {photos.map((item, idx) => {
                  const photoUrl = typeof item === 'string' ? item : (item?.url || item?.preview || '');
                  return (
                    <div key={idx} className="relative group h-24 rounded-lg overflow-hidden border border-emerald-500/20 bg-[#050e08]">
                      <img src={photoUrl} alt={`Property Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 text-[9px] font-bold shadow">
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
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Videos Tab */
        <div className="space-y-4">
          <div className={`border-2 border-dashed border-emerald-600/30 hover:border-emerald-500/60 rounded-lg ${compact ? 'p-5 min-h-[130px]' : 'p-8 min-h-[170px]'} bg-[#050e08] text-center flex flex-col items-center justify-center transition-all`}>
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
              <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                <Video size={20} />
              </div>
              <span className="text-sm font-bold text-white">
                Click to upload video clips of your property
              </span>
              <span className="text-xs text-slate-400">
                Supports MP4, WEBM clips up to 25MB showing property access and trees
              </span>
            </label>
          </div>

          {/* Videos List Gallery */}
          {videos.length > 0 && (
            <div className="pt-1">
              <span className="text-xs font-bold text-slate-300 block mb-2">
                Attached Video Clips ({videos.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {videos.map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-emerald-500/20 bg-[#050e08] p-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <Play size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block">Video Clip #{idx + 1}</span>
                        <span className="text-[10px] text-slate-400 block">Property walk-through clip</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(idx)}
                      className="p-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
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
