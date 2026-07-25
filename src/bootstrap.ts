// @ts-nocheck
// Bootstrap file - runs before any other code
// This ensures TextEncoder/TextDecoder are available before Effect is loaded

require("bare-encoding/global")

// Now load the main module
require("./index.js")
