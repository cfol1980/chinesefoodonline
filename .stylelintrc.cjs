module.exports = {
  // Minimal config to avoid "Unknown at rule" errors for Tailwind directives
  // Many editor integrations (Stylelint extension) will respect this and stop
  // flagging @tailwind, @apply, etc. as unknown.
  extends: ["stylelint-config-recommended"],
  rules: {
    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": [
          "tailwind",
          "apply",
          "variants",
          "responsive",
          "screen",
          "layer",
          "config"
        ]
      }
    ]
  },
  ignoreFiles: ["**/node_modules/**", ".next/**"]
};
