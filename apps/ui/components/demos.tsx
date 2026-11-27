"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";
import {
  ChevronsUpDownIcon,
  Trash2Icon,
  FileTextIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/ui/alert-dialog";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@workspace/ui/components/ui/attachment";
import { Avatar, AvatarFallback } from "@workspace/ui/components/ui/avatar";
import { ConfirmDialog } from "@workspace/ui/components/confirm-dialog";
import { EmptyState, TableEmpty } from "@workspace/ui/components/empty-state";
import { DiagramFigure } from "@workspace/ui/components/figure-diagram";
import { DialFigure } from "@workspace/ui/components/figure-dial";
import { LessonFigure } from "@workspace/ui/components/figure-lesson";
import { QuizFigure } from "@workspace/ui/components/figure-quiz";
import { TraceFigure } from "@workspace/ui/components/figure-trace";
import { Hero, HeroTitle } from "@workspace/ui/components/hero";
import { Scrolly } from "@workspace/ui/components/scrolly";
import { LEAVE_EVENT } from "@workspace/ui/components/page-decode";
import { Rows } from "@workspace/ui/components/rows";
import { SectionTitle } from "@workspace/ui/components/section-title";
import { StarField } from "@workspace/ui/components/star-field";
import { TvStatic } from "@workspace/ui/components/tv";
import {
  Command as ShellCommand,
  Cursor,
} from "@workspace/ui/components/shell";
import { StatusPage } from "@workspace/ui/components/status-page";
import { Badge } from "@workspace/ui/components/ui/badge";
import { Bubble } from "@workspace/ui/components/ui/bubble";
import { Button } from "@workspace/ui/components/ui/button";
import { Calendar } from "@workspace/ui/components/ui/calendar";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/ui/chart";
import { Checkbox } from "@workspace/ui/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/ui/collapsible";
import {
  ComboboxContent,
  ComboboxTrigger,
} from "@workspace/ui/components/ui/combobox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu";
import { Frame } from "@workspace/ui/components/ui/frame";
import { Input } from "@workspace/ui/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/ui/input-group";
import { Label } from "@workspace/ui/components/ui/label";
import { MaskReveal } from "@workspace/ui/components/ui/mask-reveal";
import {
  Message,
  MessageContent,
  MessageFooter,
  MessageGroup,
} from "@workspace/ui/components/ui/message";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/ui/resizable";
import { ScrambleText } from "@workspace/ui/components/ui/scramble-text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select";
import { Separator } from "@workspace/ui/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/ui/sheet";
import { Skeleton } from "@workspace/ui/components/ui/skeleton";
import { Slider } from "@workspace/ui/components/ui/slider";
import { Switch } from "@workspace/ui/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/ui/tabs";
import { Textarea } from "@workspace/ui/components/ui/textarea";
import { ThemeToggle } from "@workspace/ui/components/ui/theme-toggle";
import { Toggle } from "@workspace/ui/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip";
import { Toolbar } from "@workspace/ui/components/ui/toolbar";
import { Progress } from "@workspace/ui/components/ui/progress";
import { Spinner } from "@workspace/ui/components/ui/spinner";
import { rowDelay } from "@workspace/ui/lib/layout";

const PROJECTS = ["Plump", "Time", "Link", "Carrel", "Peck"];

const VISITS = [
  { month: "May", count: 186, last: 142 },
  { month: "Jun", count: 305, last: 198 },
  { month: "Jul", count: 237, last: 221 },
  { month: "Aug", count: 273, last: 240 },
  { month: "Sep", count: 209, last: 186 },
  { month: "Oct", count: 314, last: 263 },
];

const ROWS = [
  { name: "plump.zyx.tw", kind: "App", updated: "Oct 2" },
  { name: "carrel", kind: "Infrastructure", updated: "Oct 4" },
  { name: "peck", kind: "App", updated: "Oct 5" },
];

function ProgressDemo() {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setValue((current) => (current >= 100 ? 0 : current + 4)),
      120
    );
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="flex w-full max-w-md items-center gap-4">
      <Progress value={value} aria-label="Upload" />
      <span className="w-10 shrink-0 text-right text-caption text-muted-foreground tabular-nums">
        {value}%
      </span>
    </div>
  );
}

function ComboboxDemo() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <ComboboxTrigger placeholder="Pick a project" className="w-60">
        {value}
      </ComboboxTrigger>
      <ComboboxContent>
        <Command>
          <CommandInput placeholder="Search projects" />
          <CommandList>
            <CommandEmpty>No project found</CommandEmpty>
            <CommandGroup>
              {PROJECTS.map((project) => (
                <CommandItem
                  key={project}
                  value={project}
                  data-checked={value === project}
                  onSelect={() => {
                    setValue(project);
                    setOpen(false);
                  }}
                >
                  {project}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </ComboboxContent>
    </Popover>
  );
}

const wait = () => new Promise<void>((resolve) => setTimeout(resolve, 1000));

function EmptyStateDemo() {
  const [query, setQuery] = useState("");
  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <Input
        aria-label="Search projects"
        placeholder="Search projects"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <EmptyState
        noun="projects"
        query={query}
        onClearQuery={() => setQuery("")}
        action={<Button>New project</Button>}
      />
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmpty noun="projects" query={query} colSpan={2} />
        </TableBody>
      </Table>
    </div>
  );
}

function CalendarDemo() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return <Calendar mode="single" selected={date} onSelect={setDate} />;
}

function ScrambleDemo() {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-wrap items-center justify-center gap-5">
      <ScrambleText
        key={run}
        element="p"
        text="Design system"
        className="text-title font-medium"
      />
      <Button variant="outline" onClick={() => setRun((count) => count + 1)}>
        Replay
      </Button>
    </div>
  );
}

function MaskRevealDemo() {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-wrap items-center justify-center gap-5">
      <MaskReveal key={run} className={rowDelay(0)}>
        <p className="text-title font-medium">Revealed from the left</p>
      </MaskReveal>
      <Button variant="outline" onClick={() => setRun((count) => count + 1)}>
        Replay
      </Button>
    </div>
  );
}

// One demo per registry:ui item, keyed by its name. A page renders the demo
// for its item; an item without one gets no page.
const DEMOS: Record<string, React.ReactNode> = {
  button: (
    <div className="flex flex-wrap justify-center gap-3">
      <Button>Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Delete</Button>
      <Button size="icon" variant="outline" aria-label="Add">
        <PlusIcon />
      </Button>
    </div>
  ),
  badge: (
    <div className="flex flex-wrap justify-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="muted">Muted</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Failed</Badge>
    </div>
  ),
  input: (
    <div className="flex w-full max-w-md gap-3">
      <Input placeholder="you@example.com" type="email" />
      <Button>Subscribe</Button>
    </div>
  ),
  "input-group": (
    <InputGroup className="w-full max-w-md">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton aria-label="Send">
          <SendIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
  label: (
    <div className="flex w-full max-w-md flex-col gap-2">
      <Label htmlFor="demo-name">Name</Label>
      <Input id="demo-name" placeholder="Loki" />
    </div>
  ),
  textarea: <Textarea className="w-full max-w-md" placeholder="Write a note" />,
  select: (
    <Select
      items={[
        { value: "app", label: "App" },
        { value: "infrastructure", label: "Infrastructure" },
      ]}
    >
      <SelectTrigger className="w-60">
        <SelectValue placeholder="Pick a kind" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="app">App</SelectItem>
        <SelectItem value="infrastructure">Infrastructure</SelectItem>
      </SelectContent>
    </Select>
  ),
  combobox: <ComboboxDemo />,
  command: (
    <Command className="w-full max-w-md">
      <CommandInput placeholder="Search projects" />
      <CommandList>
        <CommandGroup>
          {PROJECTS.slice(0, 3).map((project) => (
            <CommandItem key={project}>{project}</CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  ),
  checkbox: (
    <Label>
      <Checkbox defaultChecked />
      Email me when it ships
    </Label>
  ),
  switch: (
    <Label>
      <Switch defaultChecked />
      Dark corners
    </Label>
  ),
  slider: <Slider className="w-full max-w-md" defaultValue={[40]} />,
  toggle: <Toggle aria-label="Pin">Pin</Toggle>,
  calendar: <CalendarDemo />,
  dialog: (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Rename
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename project</DialogTitle>
          <DialogDescription>The name shows on its card.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dialog-name">Name</Label>
          <Input id="dialog-name" defaultValue="Plump" />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  "alert-dialog": (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
          <AlertDialogDescription>
            Its page and files go away for good.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  sheet: (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Details</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Plump</SheetTitle>
          <SheetDescription>Turn an SVG into a 3D object.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
  popover: (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        Share
      </PopoverTrigger>
      <PopoverContent className="p-6">
        Anyone with the link can view it.
      </PopoverContent>
    </Popover>
  ),
  "dropdown-menu": (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Actions
        <ChevronsUpDownIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Project</DropdownMenuLabel>
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Archive</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  tooltip: (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>
        Hover
      </TooltipTrigger>
      <TooltipContent>Opens at once</TooltipContent>
    </Tooltip>
  ),
  tabs: (
    <Tabs defaultValue="overview" className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="text-muted-foreground">
        What the project does.
      </TabsContent>
      <TabsContent value="files" className="text-muted-foreground">
        Every file it ships.
      </TabsContent>
    </Tabs>
  ),
  collapsible: (
    <Collapsible className="w-full max-w-md">
      <CollapsibleTrigger render={<Button variant="ghost" />}>
        Show the details
        <ChevronsUpDownIcon />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 text-muted-foreground">
        Built on Base UI, styled with the tokens only.
      </CollapsibleContent>
    </Collapsible>
  ),
  separator: (
    <div className="flex w-full max-w-md flex-col gap-3">
      <p>Above</p>
      <Separator />
      <p>Below</p>
    </div>
  ),
  table: (
    <Table className="w-full">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Kind</TableHead>
          <TableHead className="text-right">Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROWS.map((row) => (
          <TableRow key={row.name}>
            <TableCell>{row.name}</TableCell>
            <TableCell className="text-muted-foreground">{row.kind}</TableCell>
            <TableCell className="text-right tabular-nums">
              {row.updated}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  avatar: (
    <div className="flex gap-3">
      <Avatar>
        <AvatarFallback>LK</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>ZY</AvatarFallback>
      </Avatar>
    </div>
  ),
  skeleton: (
    <div className="flex w-full max-w-md flex-col gap-2">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-10 w-full" />
    </div>
  ),
  spinner: (
    <div className="flex items-center gap-3 text-muted-foreground">
      <Spinner />
      Saving
    </div>
  ),
  progress: <ProgressDemo />,
  sonner: (
    <Button
      variant="outline"
      onClick={() =>
        toast("Project saved", { description: "Every change is on the page." })
      }
    >
      Show a toast
    </Button>
  ),
  chart: (
    <ChartContainer
      config={{
        count: { label: "This year", color: "primary" },
        last: { label: "Last year", color: "muted" },
      }}
      className="h-60 w-full"
    >
      <BarChart accessibilityLayer data={VISITS}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="count" fill="var(--color-count)" />
        <Bar dataKey="last" fill="var(--color-last)" />
      </BarChart>
    </ChartContainer>
  ),
  frame: (
    <Frame label="ENDERCHEST" detail="14K/s" className="w-full max-w-md">
      CPU 27 MEM 45 DSK 2 TMP 42
    </Frame>
  ),
  resizable: (
    <ResizablePanelGroup orientation="horizontal" className="min-h-40 w-full">
      <ResizablePanel defaultSize="50%">
        <div className="flex h-full items-center justify-center">Source</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="50%">
        <div className="flex h-full items-center justify-center">Preview</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
  message: (
    <MessageGroup className="w-full max-w-md">
      <Message align="end">
        <MessageContent>
          <Bubble>What does Plump do?</Bubble>
        </MessageContent>
      </Message>
      <Message>
        <MessageContent>
          <Bubble variant="ghost">
            It turns an SVG into a 3D object you can light and export.
          </Bubble>
        </MessageContent>
        <MessageFooter>Assistant</MessageFooter>
      </Message>
    </MessageGroup>
  ),
  bubble: (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Bubble>A person&apos;s message sits in a muted bubble.</Bubble>
      <Bubble variant="ghost">A reply reads as plain page text.</Bubble>
    </div>
  ),
  attachment: (
    <div className="flex flex-wrap justify-center gap-3">
      <Attachment>
        <AttachmentMedia>
          <FileTextIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>brief.pdf</AttachmentTitle>
          <AttachmentDescription>240 KB</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
      <Attachment state="uploading">
        <AttachmentMedia>
          <FileTextIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>scene.json</AttachmentTitle>
          <AttachmentDescription>Uploading</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
    </div>
  ),
  "scramble-text": <ScrambleDemo />,
  "mask-reveal": <MaskRevealDemo />,
  "theme-toggle": <ThemeToggle />,
  "confirm-dialog": (
    <div className="flex items-center justify-center gap-3">
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon" aria-label="Delete">
            <Trash2Icon />
          </Button>
        }
        title="Delete this project?"
        confirmLabel="Delete"
        onConfirm={wait}
      />
      <ConfirmDialog
        trigger={<Button variant="outline">Archive</Button>}
        title="Archive this project?"
        confirmLabel="Archive"
        variant="default"
        onConfirm={wait}
      />
    </div>
  ),
  "empty-state": <EmptyStateDemo />,
  "section-title": <SectionTitle title="Components" />,
  tv: (
    <div>
      <TvStatic />
      <Button
        variant="outline"
        onClick={() => document.dispatchEvent(new Event(LEAVE_EVENT))}
      >
        Change channel
      </Button>
    </div>
  ),
  "star-field": (
    <div className="relative h-40 w-full">
      <StarField className="absolute inset-0 z-0" />
    </div>
  ),
  "figure-diagram": (
    <DiagramFigure
      diagram={{
        kind: "diagram",
        alt: "A laptop sends commands to a build machine.",
        wide: [
          "┌──────────┐   ssh   ┌─────────┐",
          "│  laptop  │ ──────▶ │  build  │",
          "└──────────┘         └─────────┘",
        ],
        steps: [
          { label: "Edit", lit: ["laptop"], text: "Edits stay on the laptop." },
          {
            label: "Run",
            lit: ["build"],
            text: "Builds and tests run remotely.",
          },
        ],
      }}
    />
  ),
  "figure-lesson": (
    <LessonFigure
      lesson={{
        kind: "lesson",
        ask: "Where should the build run?",
        states: [
          {
            label: "Laptop",
            blocks: [
              { title: "Runs on", rows: [{ text: "the laptop", tone: "dim" }] },
            ],
            text: "Closing the lid stops it.",
          },
          {
            label: "Build machine",
            blocks: [
              {
                title: "Runs on",
                rows: [{ text: "a remote VM", tone: "mark" }],
              },
            ],
            text: "The laptop stays free.",
          },
        ],
      }}
    />
  ),
  "figure-quiz": (
    <QuizFigure
      quiz={{
        kind: "quiz",
        ask: "Does each command keep the last one's directory?",
        options: ["Yes", "No"],
        items: [
          {
            text: 'ssh build "cd app"; ssh build "make"',
            answer: 1,
            why: "Each ssh call opens a new shell.",
          },
        ],
      }}
    />
  ),
  "figure-trace": (
    <TraceFigure
      trace={{
        kind: "trace",
        alt: "A model calls a tool and reads the result.",
        events: [
          { from: "USER", lines: ["List the VMs."], text: "The request." },
          {
            from: "MODEL",
            lines: ['{"tool": "list_guests"}'],
            text: "The model asks for a tool.",
          },
          {
            from: "TOOL",
            lines: ["sandbox, golem"],
            text: "The result goes back to the model.",
          },
        ],
      }}
    />
  ),
  "figure-dial": (
    <DialFigure
      dial={{
        kind: "dial",
        ask: "Files read",
        scale: 20,
        stops: [
          {
            label: "1",
            bars: [
              { label: "context", cells: 4 },
              { label: "rules", cells: 2, tone: "quiet" },
            ],
            text: "A small task.",
          },
          {
            label: "10",
            bars: [
              { label: "context", cells: 16, tone: "mark" },
              { label: "rules", cells: 2, tone: "quiet" },
            ],
            text: "The rules stay the same size.",
          },
        ],
      }}
    />
  ),
  scrolly: (
    <Scrolly
      figure={{
        kind: "trace",
        alt: "A model calls a tool and reads the result.",
        events: [
          { from: "USER", lines: ["List the VMs."], text: "The request." },
          {
            from: "MODEL",
            lines: ['{"tool": "list_guests"}'],
            text: "The model asks for a tool.",
          },
          {
            from: "TOOL",
            lines: ["sandbox, golem"],
            text: "The result goes back to the model.",
          },
        ],
      }}
    />
  ),
  hero: <Hero title={<HeroTitle text="Devices" />} subtitle="devices 6" />,
  rows: (
    <Rows
      rows={[
        { label: "System", value: "Proxmox VE" },
        { label: "Memory", value: "64 GB" },
        {
          label: "Repo",
          value: "zyx1121/www.zyx.tw",
          href: "https://github.com/zyx1121/www.zyx.tw",
        },
      ]}
    />
  ),
  shell: (
    <div>
      <ShellCommand>ls /</ShellCommand>
      <ShellCommand>
        <Cursor />
      </ShellCommand>
    </div>
  ),
  "status-page": (
    <StatusPage
      title="Something went wrong"
      command="git push"
      action={
        <Button className="self-start" onClick={() => window.location.reload()}>
          Retry
        </Button>
      }
    />
  ),
  toolbar: (
    <Toolbar>
      <Button variant="ghost">Undo</Button>
      <Button variant="ghost">Redo</Button>
      <Button>Export</Button>
    </Toolbar>
  ),
};

export function Demo({ name }: { name: string }) {
  return DEMOS[name] ?? null;
}
