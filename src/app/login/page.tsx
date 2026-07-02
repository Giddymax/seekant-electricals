import Image from "next/image";
import { LoginForm } from "./form";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { mapSettings } from "@/lib/mappers";

async function loadSettings() {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("pos_settings").select("*").eq("id", 1).single();
  return data
    ? mapSettings(data)
    : {
        companyName: "Seekant Electricals",
        sidebarCopy: "Electrical supplies, lighting, wiring and appliance retail management",
        receiptTitle: "Sales Receipt",
        receiptPrefix: "SEL",
        receiptFooter: "Thank you for choosing Seekant Electricals.",
        documentTitle: "Seekant Electricals",
      };
}

export default async function LoginPage() {
  const settings = await loadSettings();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">
            <Image
              src="/seekant-logo.png"
              alt={`${settings.companyName} logo`}
              width={512}
              height={512}
              priority
            />
          </div>
          <h1>{settings.companyName}</h1>
          <p className="sidebar-copy">{settings.sidebarCopy}</p>
        </div>
      </aside>
      <main>
        <section className="hero-panel">
          <div>
            <p className="eyebrow">{settings.companyName}</p>
            <h2>
              Sell electrical supplies, manage stock and track daily shop performance from
              one calm control desk.
            </h2>
            <p className="hero-copy">
              From receiving cables and fittings to checkout, {settings.companyName} keeps
              products, brands, Stock Keeping Units, stock levels and sales reports
              organized in one system.
            </p>
          </div>
          <LoginForm />
        </section>
      </main>
    </div>
  );
}
