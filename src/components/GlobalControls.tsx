import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import type { ViewBy } from '@/data/csvDataService';

interface GlobalControlsProps {
  startDate: string;
  endDate: string;
  viewBy: ViewBy;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onViewByChange: (v: ViewBy) => void;
}

const HelpTip = ({ text }: { text: string }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[240px] text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const GlobalControls = ({
  startDate,
  endDate,
  viewBy,
  onStartDateChange,
  onEndDateChange,
  onViewByChange,
}: GlobalControlsProps) => {
  return (
    <div className="bg-muted/20 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row flex-wrap gap-5 items-start sm:items-end">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="from-date" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Patient Time Window
            </Label>
            <HelpTip text="Controls which patients are included. Only patients whose first GLP-1 claim (index_date) falls within this range are analyzed. Changing this rebuilds the entire cohort." />
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="from-date"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-[150px] text-sm h-9"
              min="2024-01-01"
              max="2024-12-31"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              id="to-date"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-[150px] text-sm h-9"
              min="2024-01-01"
              max="2024-12-31"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              View By
            </Label>
            <HelpTip text="Controls how patient activity is summarized over time. Does NOT change which patients are included — only changes the time resolution of charts and metrics." />
          </div>
          <Select value={viewBy} onValueChange={(v) => onViewByChange(v as ViewBy)}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="Daily">Daily</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="36d">36-Day Cycle</SelectItem>
              <SelectItem value="72d">72-Day Cycle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default GlobalControls;
