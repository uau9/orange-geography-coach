(function configureOrangeCoach(root) {
  const coach = root.OrangeCoach = root.OrangeCoach || {};
  coach.config = Object.freeze({
    APP_VERSION: "0.8.0",
    ASSET_VERSION: "0.8.0",
    EXPORT_SCHEMA_VERSION: "0.8.0",
    STUDENT_ALIAS: "橙子"
  });
  coach.features = coach.features || {};
})(typeof window !== "undefined" ? window : globalThis);
