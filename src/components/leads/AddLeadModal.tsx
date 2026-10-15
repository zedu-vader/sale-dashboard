import { X } from "lucide-react";
import type { FormEvent } from "react";

type AddLeadModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; phone: string; type: "Individual" | "Business" }) => void;
};

export function AddLeadModal({ open, onClose, onSubmit }: AddLeadModalProps) {
  if (!open) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      name: String(form.get("name")),
      phone: String(form.get("phone")),
      type: String(form.get("type")) as "Individual" | "Business",
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgb(20_15_32_/_42%)] p-[22px] backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="w-full max-w-[460px] rounded-[13px] bg-white p-[23px] shadow-[0_20px_60px_rgb(29_18_54_/_22%)]" role="dialog" aria-modal="true" aria-labelledby="add-lead-title">
        <div className="flex items-start justify-between gap-5">
          <div><h2 className="mb-[5px] mt-0 text-xl font-bold" id="add-lead-title">Add new lead</h2><p className="m-0 text-xs text-[#777180]">Enter the basic details to add a lead.</p></div>
          <button className="grid h-[34px] w-[34px] place-items-center rounded-[7px] border-0 bg-transparent p-0 text-inherit hover:bg-[#f3f0f7]" type="button" onClick={onClose} aria-label="Close add lead dialog"><X size={20} /></button>
        </div>
        <form className="mt-[22px] grid gap-[15px]" onSubmit={submit}>
          <label className="grid gap-[7px] text-xs font-semibold text-[#4f4959]">Name<input className="h-[42px] rounded-[7px] border border-[#e1dce8] bg-white px-3 font-normal text-[#282231] outline-none focus:border-[#9579d8] focus:shadow-[0_0_0_3px_#f1ecfc]" name="name" placeholder="Full name" required autoFocus /></label>
          <label className="grid gap-[7px] text-xs font-semibold text-[#4f4959]">Phone number<input className="h-[42px] rounded-[7px] border border-[#e1dce8] bg-white px-3 font-normal text-[#282231] outline-none focus:border-[#9579d8] focus:shadow-[0_0_0_3px_#f1ecfc]" name="phone" placeholder="+234 800 000 0000" required /></label>
          <label className="grid gap-[7px] text-xs font-semibold text-[#4f4959]">Lead type<select className="h-[42px] rounded-[7px] border border-[#e1dce8] bg-white px-3 font-normal text-[#282231] outline-none focus:border-[#9579d8] focus:shadow-[0_0_0_3px_#f1ecfc]" name="type"><option>Individual</option><option>Business</option></select></label>
          <div className="mt-[5px] flex justify-end gap-[9px]">
            <button type="button" className="min-h-10 rounded-[7px] border border-[#e1dce8] bg-transparent px-4 text-inherit hover:bg-[#f7f5fa]" onClick={onClose}>Cancel</button>
            <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[7px] border-0 bg-[#4b20b8] px-[17px] text-[13px] font-semibold text-white shadow-[0_5px_12px_rgb(75_32_184_/_15%)] hover:bg-[#3c169d]">Add lead</button>
          </div>
        </form>
      </section>
    </div>
  );
}
