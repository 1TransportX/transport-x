
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Search, Filter, X } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

type QuickFilter = 'all' | 'today' | 'week' | 'next7days';

interface RouteFilterBarProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  quickFilter: QuickFilter;
  onQuickFilterChange: (filter: QuickFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalGroups: number;
  totalAssignments: number;
}

const RouteFilterBar: React.FC<RouteFilterBarProps> = ({
  dateRange,
  onDateRangeChange,
  quickFilter,
  onQuickFilterChange,
  searchQuery,
  onSearchChange,
  totalGroups,
  totalAssignments
}) => {
  const quickFilters = [
    { id: 'today' as const, label: 'Today', description: 'Today only' },
    { id: 'next7days' as const, label: 'Next 7 Days', description: 'Next week' },
    { id: 'week' as const, label: 'This Week', description: 'Current week' },
    { id: 'all' as const, label: 'Custom Range', description: 'Custom date range' }
  ];

  const handleQuickToday = () => {
    const today = new Date();
    onDateRangeChange({ from: today, to: today });
    onQuickFilterChange('today');
  };

  return (
    <div className="space-y-4">
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <Button
            key={filter.id}
            variant={quickFilter === filter.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onQuickFilterChange(filter.id)}
            className="flex items-center gap-2"
          >
            {filter.label}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={handleQuickToday}
          className="text-blue-600 hover:text-blue-700"
        >
          Jump to Today
        </Button>
      </div>

      {/* Search and Custom Date Range */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by driver name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {quickFilter === 'all' && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from) {
                      onDateRangeChange({
                        from: range.from,
                        to: range.to || range.from
                      });
                    }
                  }}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <Badge variant="outline" className="flex items-center gap-1">
          <Filter className="h-3 w-3" />
          {totalGroups} dates
        </Badge>
        <Badge variant="outline">
          {totalAssignments} assignments
        </Badge>
        {searchQuery && (
          <Badge variant="secondary">
            Filtered by: "{searchQuery}"
          </Badge>
        )}
      </div>
    </div>
  );
};

export default RouteFilterBar;
