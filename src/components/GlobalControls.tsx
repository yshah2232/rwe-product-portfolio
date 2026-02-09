import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Granularity } from '@/data/syntheticData';

interface GlobalControlsProps {
  startDate: string;
  endDate: string;
  granularity: Granularity;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onGranularityChange: (g: Granularity) => void;
}

const GlobalControls = ({
  startDate,
  endDate,
  granularity,
  onStartDateChange,
  onEndDateChange,
  onGranularityChange,
}: GlobalControlsProps) => {
  return (
    <div className="border-b bg-muted/30 px-4 py-3">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Label htmlFor="from-date" className="text-sm font-medium whitespace-nowrap">
            From
          </Label>
          <Input
            id="from-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-[155px] text-sm"
            min="2024-01-01"
            max="2024-12-31"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="to-date" className="text-sm font-medium whitespace-nowrap">
            To
          </Label>
          <Input
            id="to-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-[155px] text-sm"
            min="2024-01-01"
            max="2024-12-31"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium whitespace-nowrap">Granularity</Label>
          <Select value={granularity} onValueChange={(v) => onGranularityChange(v as Granularity)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="36days">36 Days</SelectItem>
              <SelectItem value="72days">72 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default GlobalControls;
