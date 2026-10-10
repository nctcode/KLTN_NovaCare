'use client';

import { GridLayout, LiveKitRoom, ParticipantTile, RoomAudioRenderer, TrackToggle, useConnectionState, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { VideoAccess } from '@/services/consultation.service';
import '@livekit/components-styles';

function VideoControls({ leave }: { leave: () => void }) {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const connection = useConnectionState();
  return <>
    <p role="status" className="p-3">{connection === 'connected' ? 'Đã kết nối' : connection === 'reconnecting' ? 'Đang kết nối lại…' : 'Đang kết nối…'}</p>
    <div className="h-[45vh] min-h-64"><GridLayout tracks={tracks}><ParticipantTile /></GridLayout></div>
    <RoomAudioRenderer />
    <div className="flex flex-wrap justify-center gap-3 p-4">
      <TrackToggle source={Track.Source.Microphone}>Micro</TrackToggle>
      <TrackToggle source={Track.Source.Camera}>Camera</TrackToggle>
      <button className="rounded-xl bg-red-700 px-4 py-2 text-white" onClick={leave}>Rời phòng</button>
    </div>
  </>;
}

export function ConsultationVideoRoom({ access, leave, onError }: { access: VideoAccess; leave: () => void; onError: (message: string) => void }) {
  return <LiveKitRoom serverUrl={access.serverUrl} token={access.participantToken} connect audio video
    onDisconnected={leave} onError={() => onError('Không thể kết nối video. Kiểm tra quyền camera/micro và đường truyền.')}
    onMediaDeviceFailure={() => onError('Không truy cập được camera hoặc micro. Kiểm tra quyền của trình duyệt.')}
    data-lk-theme="default" className="overflow-hidden rounded-2xl bg-emerald-950 text-white">
    <VideoControls leave={leave} />
  </LiveKitRoom>;
}
