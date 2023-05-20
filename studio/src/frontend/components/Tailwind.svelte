<style global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @layer components {
    body {
      background-color: rgba(31, 41, 55, 1);
      color: white;
    }

    .title {
      -webkit-app-region: drag;
    }

    .app-bar {
      height: 50px;
      -webkit-user-select: none;
    }

    .app-btn {
      @apply bg-transparent border-none cursor-pointer focus:outline-none rounded-sm hover:bg-green-500 p-3;
    }

    ::selection {
      @apply bg-green-500;
    }

    .tab-btn {
      @apply w-full h-full border-none bg-gray-800 hover:bg-gray-700 py-4 focus:outline-none;
    }

    .container2 {
      height: calc(100vh - 50px);
    }

    .slider {
      @apply rounded-md overflow-hidden appearance-none bg-gray-700 h-3 w-40;
    }

    .slider::-webkit-slider-thumb {
      width: 15px;
      -webkit-appearance: none;
      appearance: none;
      height: 15px;
      cursor: ew-resize;
      @apply bg-green-500;
      border-radius: 50%;
      box-shadow: -405px 0 0 400px rgb(16, 185, 129);
    }

    .slider:focus {
      outline: none;
    }
  }
</style>
