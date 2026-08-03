import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { LiquidPanel } from './LiquidPanel';
import type { DeviceType } from '../types';

interface DeviceBarProps {
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
}

const DEVICES: { id: DeviceType; title: string; Icon: typeof Monitor }[] = [
  { id: 'desktop', title: 'Desktop Layout', Icon: Monitor },
  { id: 'tablet', title: 'Tablet Layout', Icon: Tablet },
  { id: 'mobile', title: 'Mobile Layout', Icon: Smartphone },
];

export function DeviceBar({ device, onDeviceChange }: DeviceBarProps) {
  return (
    <div className="flex-1 flex justify-center items-start pointer-events-none">
      <LiquidPanel className="rounded-full pointer-events-auto">
        <div className="flex items-center gap-0.5 p-1">
          {DEVICES.map(({ id, title, Icon }) => (
            <button
              key={id}
              onClick={() => onDeviceChange(id)}
              className={`p-2 rounded-full transition-all duration-150 ${
                device === id
                  ? 'selected-glass'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover-bg)] border border-transparent'
              }`}
              title={title}
            >
              <Icon size={15} strokeWidth={1.75} />
            </button>
          ))}
        </div>
      </LiquidPanel>
    </div>
  );
}
