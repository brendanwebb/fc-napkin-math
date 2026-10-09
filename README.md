# FC Napkin Math

Calculates remaining gems needed for Streamlined SBCs in EA Sports FC Ultimate Team.

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `fc-napkin-math` folder

## Usage

1. Navigate to any Streamlined SBC on EA Sports FC Ultimate Team web app
2. The extension automatically detects the score and displays a tracker
3. The tracker shows:
   - Collected gems
   - Required gems
   - Progress bar
   - Gems remaining (or "Perfect" if exact match)

The tracker is placed after the Group Rewards section and updates automatically as you build or review your SBC.

## How It Works

- Monitors the SBC score element (`.ut-one-click-sbc-header-view--score-value`)
- Calculates progress and remaining gems needed
- Uses MutationObserver for real-time updates with 6s polling fallback
- Works in both Build and Review views

## License

MIT License
