/** Empty state inside a dashboard card: fills the card body on the subtle dashed surface. */
export function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-z-md border border-dashed border-z-line-strong bg-z-subtle px-6 py-10 text-center">
      <p className="text-z-small font-medium text-z-fg">{title}</p>
      <p className="text-z-caption text-z-fg-muted">{body}</p>
    </div>
  );
}
