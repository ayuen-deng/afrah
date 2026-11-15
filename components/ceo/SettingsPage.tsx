"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";

import { ceoStore } from "@/components/ceo/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

const tabs = ["pricing", "thresholds", "discounts", "company", "screens"] as const;

export function CeoSettingsPage() {
  const { showToast } = useToast();
  const [tab, setTab] = React.useState<(typeof tabs)[number]>("pricing");
  const [pricing, setPricing] = React.useState<any[]>([]);
  const [thresholds, setThresholds] = React.useState<any>({});
  const [discounts, setDiscounts] = React.useState<any[]>([]);
  const [company, setCompany] = React.useState<any>({});
  const [screens, setScreens] = React.useState<any[]>([]);
  const [confirmMaintenance, setConfirmMaintenance] = React.useState(false);

  React.useEffect(() => {
    ceoStore.seed();
    const refresh = () => {
      setPricing(ceoStore.readPricing());
      setThresholds(ceoStore.readThresholds());
      setDiscounts(ceoStore.readDiscounts());
      setCompany(ceoStore.readCompany());
      setScreens(ceoStore.readScreens());
    };
    refresh();
    window.addEventListener(ceoStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(ceoStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Control pricing rules, thresholds, discounts, company settings, and managed screens." />
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === item ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}>
              {item}
            </button>
          ))}
        </div>
      </Card>

      {tab === "pricing" ? (
        <Card className="overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500">Rule</th><th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500">Value</th><th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500">Warning</th></tr></thead>
            <tbody>
              {pricing.map((rule) => {
                const warning = rule.label === "Prime Time" && rule.value > 2.1;
                return (
                  <tr key={rule.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{rule.label}</td>
                    <td className="px-4 py-3">
                      <input
                        value={rule.value}
                        onChange={(event) => {
                          const next = pricing.map((item) => item.id === rule.id ? { ...item, value: Number(event.target.value) } : item);
                          setPricing(next);
                          ceoStore.writePricing(next);
                        }}
                        className="h-10 w-24 rounded-lg border border-gray-200 px-3"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">{warning ? "⚠️ This change is >20%" : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : null}

      {tab === "thresholds" ? (
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(thresholds).map(([key, value]) => (
              <label key={key} className="text-sm font-medium text-gray-700">
                <div className="mb-2 capitalize">{key.replaceAll("_", " ")}</div>
                <input
                  value={String(value)}
                  onChange={(event) => {
                    const next = { ...thresholds, [key]: Number(event.target.value) };
                    setThresholds(next);
                    ceoStore.writeThresholds(next);
                  }}
                  className="h-11 w-full rounded-lg border border-gray-200 px-4"
                />
              </label>
            ))}
          </div>
        </Card>
      ) : null}

      {tab === "discounts" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {discounts.map((discount) => (
            <button key={discount.id} type="button" onClick={() => {
              const next = discounts.map((item) => item.id === discount.id ? { ...item, active: !item.active } : item);
              setDiscounts(next);
              ceoStore.writeDiscounts(next);
              showToast({ type: "success", title: "Updated", message: `${discount.name} updated.` });
            }} className="rounded-2xl border border-gray-200 bg-white p-5 text-left">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-900">{discount.name}</div>
                <Badge variant={discount.active ? "success" : "neutral"}>{discount.active ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="mt-2 text-sm text-gray-600">{discount.percent}% discount</div>
            </button>
          ))}
        </div>
      ) : null}

      {tab === "company" ? (
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["name", "Company Name"],
              ["contact", "Contact Email"],
              ["address", "Address"],
              ["vat_rate", "VAT Rate"],
            ].map(([key, label]) => (
              <label key={key} className="text-sm font-medium text-gray-700">
                <div className="mb-2">{label}</div>
                <input
                  value={company[key]}
                  onChange={(event) => {
                    const next = { ...company, [key]: key === "vat_rate" ? Number(event.target.value) : event.target.value };
                    setCompany(next);
                    ceoStore.writeCompany(next);
                  }}
                  className="h-11 w-full rounded-lg border border-gray-200 px-4"
                />
              </label>
            ))}
          </div>
          <div className="mt-6">
            <Button variant={company.maintenance_mode ? "danger" : "secondary"} onClick={() => setConfirmMaintenance(true)}>
              {company.maintenance_mode ? "Disable" : "Enable"} Maintenance Mode
            </Button>
          </div>
        </Card>
      ) : null}

      {tab === "screens" ? (
        <Card className="overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500">Screen</th><th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500">Status</th><th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500">Action</th></tr></thead>
            <tbody>
              {screens.map((screen) => (
                <tr key={screen.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{screen.name}</td>
                  <td className="px-4 py-3"><Badge variant={screen.status === "active" ? "success" : screen.status === "offline" ? "error" : "warning"}>{screen.status}</Badge></td>
                  <td className="px-4 py-3"><Button variant="secondary" onClick={() => showToast({ type: "success", title: "Saved", message: `${screen.name} settings updated.` })}>Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      <Modal open={confirmMaintenance} onClose={() => setConfirmMaintenance(false)} title="Maintenance Mode">
        <div className="space-y-4 text-sm text-gray-700">
          <div>⚠️ Enable maintenance mode? All users locked out immediately.</div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setConfirmMaintenance(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                const next = { ...company, maintenance_mode: !company.maintenance_mode };
                setCompany(next);
                ceoStore.writeCompany(next);
                setConfirmMaintenance(false);
                showToast({ type: "success", title: "Saved", message: "Maintenance mode updated." });
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
