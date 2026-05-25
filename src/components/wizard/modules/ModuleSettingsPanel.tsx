/**
 * ModuleSettingsPanel
 * ─────────────────────────────────────────────────────────────
 * Schema-driven settings drawer for a single ABX module.
 * Reads/writes BankConfig.moduleSettings[moduleId].
 */
import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useWizard } from "@/contexts/BankConfigContext";
import { defaultSettingsFor, flattenSchema, getModule, type ModuleSettingField } from "@/platform/ModuleRegistry";
import { BankGPTSettings } from "./BankGPTSettings";

type Props = {
  moduleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ModuleSettingsPanel({ moduleId, open, onOpenChange }: Props) {
  const { config, setConfig } = useWizard();
  const mod = useMemo(() => (moduleId ? getModule(moduleId) : undefined), [moduleId]);

  if (!mod) return null;

  const current = (config.moduleSettings?.[mod.id] ?? {}) as Record<string, unknown>;

  function writeField(key: string, value: unknown) {
    setConfig({
      ...config,
      moduleSettings: {
        ...(config.moduleSettings ?? {}),
        [mod!.id]: { ...current, [key]: value },
      },
    });
  }

  function resetDefaults() {
    setConfig({
      ...config,
      moduleSettings: {
        ...(config.moduleSettings ?? {}),
        [mod!.id]: defaultSettingsFor(mod!),
      },
    });
  }

  const sections = mod.settings?.sections ?? [];
  const topFields = mod.settings?.fields ?? [];
  const hasSchema = sections.length > 0 || topFields.length > 0;
  const Icon = mod.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            {mod.name} settings
          </SheetTitle>
          <SheetDescription>{mod.description}</SheetDescription>
        </SheetHeader>

        {mod.id === "bankgpt" ? (
          <div className="mt-6">
            <BankGPTSettings />
            <div className="mt-6 flex justify-end border-t border-border pt-4">
              <Button size="sm" onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        ) : !hasSchema ? (
          <div className="mt-8 rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            This module has no configurable settings yet.
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {topFields.length > 0 && (
              <FieldGroup fields={topFields} values={current} onChange={writeField} />
            )}
            {sections.map((s) => (
              <section key={s.title}>
                <h3 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {s.title}
                </h3>
                <FieldGroup fields={s.fields} values={current} onChange={writeField} />
              </section>
            ))}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button variant="ghost" size="sm" onClick={resetDefaults}>Reset to defaults</Button>
              <Button size="sm" onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function FieldGroup({
  fields,
  values,
  onChange,
}: {
  fields: ModuleSettingField[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <FieldRow key={f.key} field={f} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
      ))}
    </div>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: ModuleSettingField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === "toggle") {
    return (
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Label className="text-sm font-medium">{field.label}</Label>
          {field.help && <p className="mt-0.5 text-xs text-muted-foreground">{field.help}</p>}
        </div>
        <Switch checked={!!value} onCheckedChange={(v) => onChange(v)} />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{field.label}</Label>
        <Select value={(value as string) ?? ""} onValueChange={(v) => onChange(v)}>
          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            {field.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
      </div>
    );
  }

  if (field.type === "multiselect") {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{field.label}</Label>
        <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-card/50 p-3">
          {field.options.map((o) => {
            const checked = arr.includes(o.value);
            return (
              <label key={o.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(c) => {
                    const next = c
                      ? Array.from(new Set([...arr, o.value]))
                      : arr.filter((x) => x !== o.value);
                    onChange(next);
                  }}
                />
                <span>{o.label}</span>
              </label>
            );
          })}
        </div>
        {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{field.label}</Label>
        <Input
          type="number"
          value={value === undefined || value === null ? "" : String(value)}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? "" : Number(v));
          }}
        />
        {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
      </div>
    );
  }

  // text
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{field.label}</Label>
      <Input
        type="text"
        value={(value as string) ?? ""}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
    </div>
  );
}
