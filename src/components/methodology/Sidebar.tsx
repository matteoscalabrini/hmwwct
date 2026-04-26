'use client';

import { useState, useEffect } from 'react';

interface SidebarProps {
  sections: { id: string; label: string }[];
}

export function Sidebar({ sections }: SidebarProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Table of contents" className="methodology-sidebar" style={{
      position: 'sticky', top: 'calc(var(--header-h) + var(--methodology-progress-h) + var(--s-5))',
      width: 240, flexShrink: 0, alignSelf: 'flex-start',
    }}>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}>
        {sections.map(s => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="t-label"
              style={{ color: activeId === s.id ? 'var(--phosphor)' : 'var(--fg-dim)', textDecoration: 'none', display: 'block', padding: 'var(--s-1) 0' }}>
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
