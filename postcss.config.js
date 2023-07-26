module.exports = {
  plugins: {
    autoprefixer: {},
    tailwindcss: {
      content: ["layouts/**/*.html", "content/**/*.md", "content/**/*.html"],
      theme: {
        fontFamily: {
          sans: ["Commit Mono", "sans-serif"],
        },
      },
    },
  },
};
