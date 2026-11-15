"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Check, Info, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

const profileSchema = z.object({
  first_name: z.string().min(2, "First name is required."),
  last_name: z.string().min(2, "Last name is required."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().min(7, "Phone is required."),
  country: z.string().min(2, "Country is required."),
  city: z.string().min(2, "City is required."),
  company: z.string().min(2, "Company name is required."),
  avatar_url: z.string().url("Enter a valid URL.").or(z.literal("")),
});

type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required."),
    new_password: z.string().min(8, "New password must be at least 8 characters."),
    confirm_password: z.string().min(1, "Confirm your new password."),
  })
  .superRefine((val, ctx) => {
    if (val.new_password !== val.confirm_password) {
      ctx.addIssue({
        code: "custom",
        path: ["confirm_password"],
        message: "Passwords do not match.",
      });
    }
  });

type PasswordValues = z.infer<typeof passwordSchema>;
type Prefs = { email: boolean; sms: boolean; whatsapp: boolean };

const STORAGE_KEY = "afrah_customer_profile";

export default function CustomerProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const [tab, setTab] = React.useState<"personal" | "password" | "notifications">("personal");
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingPassword, setSavingPassword] = React.useState(false);
  const [savedPulse, setSavedPulse] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteText, setDeleteText] = React.useState("");
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [countryCode, setCountryCode] = React.useState("+256");

  const [prefs, setPrefs] = React.useState<Prefs>({
    email: true,
    sms: false,
    whatsapp: true,
  });

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "Sarah",
      last_name: "Nakato",
      email: "sarah@gmail.com",
      phone: "0771234567",
      country: "Uganda",
      city: "Kampala",
      company: "Personal",
      avatar_url: "https://picsum.photos/seed/cust3/200/200",
    },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ProfileValues> & {
        prefs?: Prefs;
        countryCode?: string;
      };
      (Object.keys(profileForm.getValues()) as Array<keyof ProfileValues>).forEach((field) => {
        const val = parsed[field];
        if (typeof val === "string") {
          profileForm.setValue(field, val);
        }
      });
      if (parsed.prefs) setPrefs(parsed.prefs);
      if (parsed.countryCode) setCountryCode(parsed.countryCode);
    } catch {
      // ignore malformed storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persistProfile(next: ProfileValues, nextPrefs: Prefs, nextCountryCode: string) {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...next,
        prefs: nextPrefs,
        countryCode: nextCountryCode,
      }),
    );
    window.dispatchEvent(new Event("afrah_profile_updated"));
  }

  const values = profileForm.watch();
  const fullName = `${values.first_name} ${values.last_name}`.trim();

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[24px] font-semibold text-gray-900">Profile & Settings</div>
        <div className="mt-1 text-sm text-gray-600">
          Manage your personal information, password, and notification preferences.
        </div>
      </div>

      <Card className="p-0">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "personal", label: "Personal Info" },
                { key: "password", label: "Emails & Password" },
                { key: "notifications", label: "Notifications" },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={
                  tab === item.key
                    ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                    : "rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "personal" ? (
          <div className="space-y-6 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarPreview ?? values.avatar_url ?? ""}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-1 right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white transition-transform hover:scale-110"
                    aria-label="Upload avatar"
                  >
                    <Camera className="h-2.5 w-2.5" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const url = URL.createObjectURL(file);
                      setAvatarPreview(url);
                      showToast({
                        type: "success",
                        title: "Avatar selected",
                        message: "Save changes to apply this photo.",
                      });
                    }}
                  />
                </div>
                <div>
                  <div className="text-base font-semibold text-gray-900">{fullName}</div>
                  <div className="text-[13px] text-gray-400">{values.email}</div>
                </div>
              </div>

              {savingProfile ? (
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving changes...
                </div>
              ) : null}
            </div>

            <form
              className="space-y-4"
              onSubmit={profileForm.handleSubmit(async (formValues) => {
                setSavingProfile(true);
                try {
                  await new Promise((resolve) => setTimeout(resolve, 900));
                  persistProfile(formValues, prefs, countryCode);
                  setSavedPulse(true);
                  window.setTimeout(() => setSavedPulse(false), 1200);
                  showToast({
                    type: "success",
                    title: "Profile updated",
                    message: "Your changes were saved successfully.",
                  });
                } finally {
                  setSavingProfile(false);
                }
              })}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[13px] font-medium text-gray-600">First Name</label>
                  <input
                    {...profileForm.register("first_name")}
                    className="mt-2 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {profileForm.formState.errors.first_name ? (
                    <div className="mt-1 text-xs text-red-600">{profileForm.formState.errors.first_name.message}</div>
                  ) : null}
                </div>
                <div>
                  <label className="text-[13px] font-medium text-gray-600">Last Name</label>
                  <input
                    {...profileForm.register("last_name")}
                    className="mt-2 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {profileForm.formState.errors.last_name ? (
                    <div className="mt-1 text-xs text-red-600">{profileForm.formState.errors.last_name.message}</div>
                  ) : null}
                </div>

                <div>
                  <label className="text-[13px] font-medium text-gray-600">Email Address</label>
                  <input
                    {...profileForm.register("email")}
                    className="mt-2 h-11 w-full rounded-lg border border-gray-200 bg-blue-50/40 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {profileForm.formState.errors.email ? (
                    <div className="mt-1 text-xs text-red-600">{profileForm.formState.errors.email.message}</div>
                  ) : null}
                </div>
                <div>
                  <label className="text-[13px] font-medium text-gray-600">Phone Number</label>
                  <div className="mt-2 flex h-11 overflow-hidden rounded-lg border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                    <select
                      value={countryCode}
                      onChange={(event) => setCountryCode(event.target.value)}
                      className="w-20 border-r border-gray-200 bg-gray-50 px-2 text-sm text-gray-600 outline-none"
                    >
                      <option value="+256">+256</option>
                      <option value="+254">+254</option>
                      <option value="+255">+255</option>
                    </select>
                    <input
                      {...profileForm.register("phone")}
                      className="w-full px-3 text-sm text-gray-900 outline-none"
                    />
                  </div>
                  {profileForm.formState.errors.phone ? (
                    <div className="mt-1 text-xs text-red-600">{profileForm.formState.errors.phone.message}</div>
                  ) : null}
                </div>

                <div>
                  <label className="text-[13px] font-medium text-gray-600">Country</label>
                  <select
                    {...profileForm.register("country")}
                    className="mt-2 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option>Uganda</option>
                    <option>Kenya</option>
                    <option>Tanzania</option>
                    <option>Rwanda</option>
                  </select>
                  {profileForm.formState.errors.country ? (
                    <div className="mt-1 text-xs text-red-600">{profileForm.formState.errors.country.message}</div>
                  ) : null}
                </div>
                <div>
                  <label className="text-[13px] font-medium text-gray-600">City</label>
                  <select
                    {...profileForm.register("city")}
                    className="mt-2 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option>Kampala</option>
                    <option>Entebbe</option>
                    <option>Jinja</option>
                    <option>Mbarara</option>
                  </select>
                  {profileForm.formState.errors.city ? (
                    <div className="mt-1 text-xs text-red-600">{profileForm.formState.errors.city.message}</div>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-gray-600">Company Name</label>
                <input
                  {...profileForm.register("company")}
                  className="mt-2 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {profileForm.formState.errors.company ? (
                  <div className="mt-1 text-xs text-red-600">{profileForm.formState.errors.company.message}</div>
                ) : null}
              </div>

              <div className="flex justify-end">
                <Button type="submit" loading={savingProfile}>
                  {savedPulse ? (
                    <span className="inline-flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Saved
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>

            <div className="border-t border-gray-100 pt-5">
              <div className="text-sm font-medium text-gray-600">Delete Account</div>
              <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                <div className="inline-flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 text-blue-600" />
                  <span>
                    After making a deletion request, you will have 6 months to maintain this account.
                  </span>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                To permanently erase your Afrah Media account, click the button below. This implies
                that you will not have access to your campaigns, invoices, or booking history.
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete My Account
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "password" ? (
          <div className="px-6 py-5">
            <div className="text-[18px] font-semibold text-gray-800">Change Password</div>
            <div className="mt-1 text-sm text-gray-600">Password updates are simulated in this demo.</div>

            <form
              className="mt-6 max-w-xl space-y-4"
              onSubmit={passwordForm.handleSubmit(async () => {
                setSavingPassword(true);
                try {
                  await new Promise((resolve) => setTimeout(resolve, 900));
                  showToast({
                    type: "success",
                    title: "Password updated",
                    message: "Your password has been changed successfully.",
                  });
                  passwordForm.reset();
                } finally {
                  setSavingPassword(false);
                }
              })}
            >
              <div>
                <label className="text-[13px] font-medium text-gray-600">Current Password</label>
                <input
                  type="password"
                  {...passwordForm.register("current_password")}
                  className="mt-2 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {passwordForm.formState.errors.current_password ? (
                  <div className="mt-1 text-xs text-red-600">
                    {passwordForm.formState.errors.current_password.message}
                  </div>
                ) : null}
              </div>
              <div>
                <label className="text-[13px] font-medium text-gray-600">New Password</label>
                <input
                  type="password"
                  {...passwordForm.register("new_password")}
                  className="mt-2 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {passwordForm.formState.errors.new_password ? (
                  <div className="mt-1 text-xs text-red-600">{passwordForm.formState.errors.new_password.message}</div>
                ) : null}
              </div>
              <div>
                <label className="text-[13px] font-medium text-gray-600">Confirm Password</label>
                <input
                  type="password"
                  {...passwordForm.register("confirm_password")}
                  className="mt-2 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {passwordForm.formState.errors.confirm_password ? (
                  <div className="mt-1 text-xs text-red-600">
                    {passwordForm.formState.errors.confirm_password.message}
                  </div>
                ) : null}
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={savingPassword}>
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        ) : null}

        {tab === "notifications" ? (
          <div className="px-6 py-5">
            <div className="text-[18px] font-semibold text-gray-800">Notification Preferences</div>
            <div className="mt-1 text-sm text-gray-600">Choose how you receive updates.</div>

            <div className="mt-6 max-w-xl space-y-3">
              {(
                [
                  {
                    key: "email",
                    label: "Email",
                    desc: "Receive receipts and invoice reminders.",
                  },
                  { key: "sms", label: "SMS", desc: "Short alerts for due invoices." },
                  {
                    key: "whatsapp",
                    label: "WhatsApp",
                    desc: "Instant campaign updates in WhatsApp.",
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    const next = { ...prefs, [item.key]: !prefs[item.key] };
                    setPrefs(next);
                    persistProfile(profileForm.getValues(), next, countryCode);
                    showToast({
                      type: "success",
                      title: "Updated",
                      message: `${item.label} notifications ${next[item.key] ? "enabled" : "disabled"}.`,
                    });
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                  <div
                    className={
                      prefs[item.key] ? "h-6 w-11 rounded-full bg-primary p-1" : "h-6 w-11 rounded-full bg-gray-200 p-1"
                    }
                  >
                    <div
                      className={
                        prefs[item.key]
                          ? "h-4 w-4 translate-x-5 rounded-full bg-white transition-transform"
                          : "h-4 w-4 translate-x-0 rounded-full bg-white transition-transform"
                      }
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      <Modal
        open={deleteOpen}
        title="Confirm account deletion"
        onClose={() => setDeleteOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteText.trim() !== "DELETE"}
              loading={savingProfile}
              onClick={async () => {
                setSavingProfile(true);
                try {
                  await new Promise((resolve) => setTimeout(resolve, 900));
                  await fetch("/api/auth/logout", { method: "POST" });
                  window.localStorage.removeItem(STORAGE_KEY);
                  showToast({
                    type: "success",
                    title: "Account deleted",
                    message: "Redirecting to sign up...",
                  });
                  router.push("/signup");
                } finally {
                  setSavingProfile(false);
                }
              }}
            >
              Delete Account
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="text-sm text-gray-700">Type DELETE to permanently remove your account.</div>
          <input
            value={deleteText}
            onChange={(event) => setDeleteText(event.target.value)}
            placeholder="Type DELETE"
            className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </Modal>
    </div>
  );
}
