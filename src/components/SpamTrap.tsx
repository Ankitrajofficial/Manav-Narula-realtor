/** A field people never see or reach. Bots fill in every box, and /api/enquiry quietly drops anything with this filled. */
export default function SpamTrap() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>Leave this empty<input type="text" name="hp_field" tabIndex={-1} autoComplete="off" /></label>
    </div>
  );
}
