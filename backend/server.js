const app = require("./src/index");
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Police City Management Backend (Supabase Engine) running on port ${PORT}`);
  });
}

module.exports = app;