import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useContent, useContentStatus } from '../hooks/content';
import Spinner from '../components/spinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type Tab = 'text' | 'audio' | 'video';

const tabs: { key: Tab; label: string }[] = [
  { key: 'text', label: 'Content' },
  { key: 'audio', label: 'Audio' },
  { key: 'video', label: 'Video' },
];

function MediaGenerating({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      <p className="text-sm text-gray-500">{label} is being generated...</p>
    </div>
  );
}

function MediaUnavailable({ label }: { label: string }) {
  return (
    <p className="py-12 text-center text-sm text-gray-400">
      {label} is not available for this lesson.
    </p>
  );
}

export default function LearnPage() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('text');

  const { data: statusData } = useContentStatus(nodeId!);

  const textStatus = statusData?.textStatus;
  const audioStatus = statusData?.audioStatus;
  const videoStatus = statusData?.videoStatus;

  // Show content as soon as text is ready (don't wait for audio/video)
  const textReady = textStatus === 'ready';
  const allFailed = textStatus === 'failed';

  const { data: content, isLoading: contentLoading } = useContent(nodeId!, {
    enabled: textReady,
  });

  if (allFailed) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-red-600">
          Something went wrong generating this lesson.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700"
        >
          Go back
        </button>
      </div>
    );
  }

  if (!textReady) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        <p className="mt-4 text-sm text-gray-500">
          Your lesson is being prepared. This may take a moment.
        </p>
      </div>
    );
  }

  if (contentLoading || !content) {
   return <Spinner />;
  }

  const isGenerating = (s: string | undefined) => !s || s === 'pending' || s === 'generating';
  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
         Go Back
      </button>

      {/* Tab bar */}
      <div className="mt-6 flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => {
          const mediaStatus = tab.key === 'text' ? textStatus : tab.key === 'audio' ? audioStatus : videoStatus;
          const generating = tab.key !== 'text' && isGenerating(mediaStatus);

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-gray-900 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {generating && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 min-h-[40vh]">
        {activeTab === 'text' && (
          content.text ? (
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown>{content.text}</ReactMarkdown>
            </div>
          ) : (
            <MediaUnavailable label="Text content" />
          )
        )}

        {activeTab === 'audio' && (
          isGenerating(audioStatus) ? (
            <MediaGenerating label="Audio" />
          ) : content.audioUrl ? (
            <div className="flex flex-col items-center gap-4 pt-8">
              <p className="text-sm text-gray-500">Listen to this lesson</p>
              <audio controls className="w-full max-w-lg">
                <source src={`${API_URL}${content.audioUrl}`} />
                Your browser does not support the audio element.
              </audio>
            </div>
          ) : (
            <MediaUnavailable label="Audio" />
          )
        )}

        {activeTab === 'video' && (
          isGenerating(videoStatus) ? (
            <MediaGenerating label="Video" />
          ) : content.videoUrl ? (
            <div className="flex flex-col items-center gap-4 pt-4">
              <video controls className="w-full max-w-2xl rounded-lg">
                <source src={`${API_URL}${content.videoUrl}`} />
                Your browser does not support the video element.
              </video>
            </div>
          ) : (
            <MediaUnavailable label="Video" />
          )
        )}
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <Link
          to={`/quiz/${nodeId}`}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Take Quiz
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
