export function formatClock(totalMinutes) {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function dateDelta(totalMinutes) { return Math.floor(totalMinutes / 1440); }
function dateRelationLabel(delta) { return delta < 0 ? "前一天" : delta > 0 ? "后一天" : "同一天"; }

export function longitudeLabel(longitude) {
  if (longitude === 0) return "0°";
  return `${Math.abs(longitude)}°${longitude > 0 ? "E" : "W"}`;
}

function longitudeRelation(longitude) { return longitude > 0 ? "东经" : longitude < 0 ? "西经" : "本初子午线"; }

function theoreticalZoneIndex(longitude) {
  if (longitude === 0) return 0;
  return Math.sign(longitude) * Math.floor(Math.abs(longitude) / 15 + 0.5);
}

function zoneLabel(index) { return index === 0 ? "零时区" : `${index > 0 ? "东" : "西"}${Math.abs(index)}区`; }

export function normalizeTimeAnswer(value = "") {
  const match = String(value).trim().replace(/[：.时]/g, ":").match(/^(\d{1,2}):?(\d{2})$/);
  if (!match) return "";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return "";
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function calculateTimeLabAnswers(scenario, longitude) {
  const zoneIndex = theoreticalZoneIndex(longitude);
  const localTotal = scenario.utc_minutes + longitude * 4;
  const zoneTotal = scenario.utc_minutes + zoneIndex * 60;
  return {
    relation: longitudeRelation(longitude),
    local_time: formatClock(localTotal),
    zone_time: formatClock(zoneTotal),
    date_relation: dateRelationLabel(dateDelta(zoneTotal)),
    local_date_relation: dateRelationLabel(dateDelta(localTotal)),
    zone_name: zoneLabel(zoneIndex),
    zone_index: zoneIndex
  };
}
