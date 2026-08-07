"use client";

import {
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileUp,
  LibraryBig,
  MessagesSquare,
  School,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";

type Audience = "teacher" | "student" | "ai" | "shared";
type Filter = "all" | Audience;

type CapabilityGroup = {
  title: string;
  phase: string;
  icon: LucideIcon;
  features: Array<{ label: string; audiences: Audience[] }>;
};

const groups: CapabilityGroup[] = [
  {
    title: "Secure foundation",
    phase: "Access",
    icon: ShieldCheck,
    features: [
      { label: "Authentication and role selection", audiences: ["shared"] },
      { label: "Protected teacher and student routes", audiences: ["shared"] },
      { label: "Email and password security dashboards", audiences: ["shared"] },
      { label: "Persistent data and seeded demo workspace", audiences: ["shared"] },
    ],
  },
  {
    title: "Classroom operations",
    phase: "Organise",
    icon: School,
    features: [
      { label: "Create and manage classes", audiences: ["teacher"] },
      { label: "Join classes with secure class codes", audiences: ["student"] },
      { label: "Enrollment rosters and class workspaces", audiences: ["teacher"] },
      { label: "Complete Class 6–12 subject catalog", audiences: ["shared"] },
    ],
  },
  {
    title: "AI planning studio",
    phase: "Plan",
    icon: Sparkles,
    features: [
      { label: "Lesson plan generator", audiences: ["teacher", "ai"] },
      { label: "Explanation generator", audiences: ["teacher", "ai"] },
      { label: "Notes and summary generator", audiences: ["teacher", "ai"] },
      { label: "Revision sheet generator", audiences: ["teacher", "ai"] },
    ],
  },
  {
    title: "Assessment creation",
    phase: "Assign",
    icon: BookOpenCheck,
    features: [
      {
        label: "Assignments, homework, tests and worksheets",
        audiences: ["teacher"],
      },
      { label: "Question generator", audiences: ["teacher", "ai"] },
      { label: "Quiz generator and editable builder", audiences: ["teacher", "ai"] },
      { label: "Published student quiz attempts", audiences: ["student"] },
    ],
  },
  {
    title: "Resources & communication",
    phase: "Teach",
    icon: LibraryBig,
    features: [
      { label: "Resource and question-paper library", audiences: ["teacher", "student"] },
      { label: "Announcements and reminders", audiences: ["teacher", "student", "ai"] },
      { label: "Attendance and participation records", audiences: ["teacher"] },
      { label: "Class updates in the student workspace", audiences: ["student"] },
    ],
  },
  {
    title: "Handwritten submission",
    phase: "Collect",
    icon: FileUp,
    features: [
      { label: "Multi-page answer photo upload", audiences: ["student"] },
      { label: "Page preview, ordering and removal", audiences: ["student"] },
      { label: "Submission checklist and status tracking", audiences: ["student"] },
      { label: "Private, validated file handling", audiences: ["shared"] },
    ],
  },
  {
    title: "Review & results",
    phase: "Evaluate",
    icon: ClipboardCheck,
    features: [
      { label: "Teacher page-by-page submission review", audiences: ["teacher"] },
      { label: "AI-assisted feedback suggestions", audiences: ["teacher", "ai"] },
      { label: "Editable marks and teacher feedback", audiences: ["teacher"] },
      { label: "Teacher-controlled result publishing", audiences: ["teacher", "student"] },
    ],
  },
  {
    title: "Learning support",
    phase: "Support",
    icon: BrainCircuit,
    features: [
      { label: "Student doubt assistant", audiences: ["student", "ai"] },
      { label: "Student revision assistant", audiences: ["student", "ai"] },
      { label: "Subject-aware approved model routing", audiences: ["ai"] },
      { label: "Editable, reviewable AI outputs", audiences: ["teacher", "ai"] },
    ],
  },
  {
    title: "Progress intelligence",
    phase: "Analyse",
    icon: BarChart3,
    features: [
      { label: "Teacher class and workload analytics", audiences: ["teacher"] },
      { label: "Student score and progress trends", audiences: ["student"] },
      { label: "Weak-topic and attention signals", audiences: ["teacher", "student"] },
      { label: "Activity log and time-saved estimates", audiences: ["teacher"] },
    ],
  },
  {
    title: "Teacher-owned AI",
    phase: "Control",
    icon: MessagesSquare,
    features: [
      { label: "Feedback and announcement generators", audiences: ["teacher", "ai"] },
      { label: "Approval before assignment or publishing", audiences: ["teacher", "ai"] },
      { label: "Honest fallback and limitation messaging", audiences: ["shared", "ai"] },
      { label: "Final academic decisions stay human", audiences: ["shared", "ai"] },
    ],
  },
];

const filters: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "Complete platform" },
  { id: "teacher", label: "Teacher" },
  { id: "student", label: "Student" },
  { id: "ai", label: "AI & safety" },
  { id: "shared", label: "Foundation" },
];

export function FeatureAtlas() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedGroup, setSelectedGroup] = useState(groups[0].title);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const groupRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function getVisibleGroups(nextFilter: Filter) {
    return groups
      .map((group) => ({
        ...group,
        features:
          nextFilter === "all"
            ? group.features
            : group.features.filter((feature) =>
                feature.audiences.includes(nextFilter),
              ),
      }))
      .filter((group) => group.features.length > 0);
  }

  function selectFilter(nextFilter: Filter) {
    const nextGroups = getVisibleGroups(nextFilter);
    setFilter(nextFilter);
    setSelectedGroup(nextGroups[0]?.title ?? groups[0].title);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % filters.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + filters.length) % filters.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = filters.length - 1;

    if (nextIndex === null) return;
    event.preventDefault();
    const nextFilter = filters[nextIndex];
    selectFilter(nextFilter.id);
    tabRefs.current[nextIndex]?.focus();
  }

  function handleGroupKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % visibleGroups.length;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + visibleGroups.length) % visibleGroups.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = visibleGroups.length - 1;

    if (nextIndex === null) return;
    event.preventDefault();
    setSelectedGroup(visibleGroups[nextIndex].title);
    groupRefs.current[nextIndex]?.focus();
  }

  const visibleGroups = getVisibleGroups(filter);
  const activeGroup =
    visibleGroups.find((group) => group.title === selectedGroup) ??
    visibleGroups[0] ??
    groups[0];
  const activeGroupIndex = visibleGroups.findIndex(
    (group) => group.title === activeGroup.title,
  );
  const ActiveIcon = activeGroup.icon;

  return (
    <div className="feature-atlas">
      <div className="feature-atlas-toolbar">
        <div className="feature-atlas-filters" role="tablist" aria-label="Filter capabilities">
          {filters.map((item) => {
            const active = item.id === filter;
            return (
              <button
                className="feature-atlas-filter"
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls="feature-atlas-panel"
                id={`feature-atlas-tab-${item.id}`}
                tabIndex={active ? 0 : -1}
                key={item.id}
                onClick={() => selectFilter(item.id)}
                onKeyDown={(event) => handleTabKeyDown(event, filters.indexOf(item))}
                ref={(element) => {
                  tabRefs.current[filters.indexOf(item)] = element;
                }}
              >
                {active ? (
                  <span className="feature-atlas-filter-active" />
                ) : null}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        <span className="feature-atlas-count" aria-live="polite">
          {visibleGroups.reduce((total, group) => total + group.features.length, 0)} capabilities
        </span>
      </div>

      <div
        className="feature-atlas-panel"
        id="feature-atlas-panel"
        role="tabpanel"
        aria-labelledby={`feature-atlas-tab-${filter}`}
      >
        <div
          className="feature-atlas-grid feature-atlas-compact-grid"
          data-filter={filter}
          key={filter}
          aria-label="Capability areas"
        >
          {visibleGroups.map((group, index) => {
            const Icon = group.icon;
            const active = group.title === activeGroup.title;
            return (
              <button
                className={`feature-atlas-group${active ? " is-active" : ""}`}
                type="button"
                key={group.title}
                id={`feature-atlas-group-${index}`}
                aria-expanded={active}
                aria-controls="feature-atlas-detail"
                onClick={() => setSelectedGroup(group.title)}
                onKeyDown={(event) => handleGroupKeyDown(event, index)}
                ref={(element) => {
                  groupRefs.current[index] = element;
                }}
                style={{
                  animationDelay: `${Math.min(index * 0.02, 0.12)}s`,
                }}
              >
                <span className="feature-atlas-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className="feature-atlas-group-copy">
                  <span>
                    {group.phase} · {group.features.length}
                  </span>
                  <strong>{group.title}</strong>
                </span>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <p className="feature-atlas-swipe-hint" aria-hidden="true">
          Swipe to explore all capability areas →
        </p>

          <section
            className="feature-atlas-detail"
            id="feature-atlas-detail"
            key={`${filter}-${activeGroup.title}`}
            role="region"
            aria-labelledby={`feature-atlas-group-${activeGroupIndex}`}
          >
            <div className="feature-atlas-detail-heading">
              <span className="feature-atlas-detail-icon" aria-hidden="true">
                <ActiveIcon size={20} />
              </span>
              <div>
                <span>{activeGroup.phase}</span>
                <h3>{activeGroup.title}</h3>
              </div>
            </div>
            <ul>
              {activeGroup.features.map((feature) => (
                <li key={feature.label}>
                  <Check size={15} aria-hidden="true" />
                  <span>{feature.label}</span>
                </li>
              ))}
            </ul>
          </section>
      </div>
    </div>
  );
}
