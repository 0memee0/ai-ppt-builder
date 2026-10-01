import { redirect } from "next/navigation";

/** `/editor` without a deck goes back to the start screen. */
export default function EditorIndex() {
  redirect("/");
}
