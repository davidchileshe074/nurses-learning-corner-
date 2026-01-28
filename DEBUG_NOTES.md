# Navigation Context Error - Debugging Notes

## Error
`Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'?`

## When it occurs
- When clicking course filter buttons in LibraryScreen
- Happens immediately after selection
- Persists even with:
  - No navigation hooks in LibraryScreen
  - Dummy data (no API calls)
  - Simplified UI components
  - No TextInput/KeyboardAvoidingView

## Key Finding
The error occurs during STATE UPDATE, not during navigation.

## Hypothesis
The `route.params` (initialSubject) is being accessed or modified in a way that triggers
a navigation context check during the component's render cycle.

## Next Steps
1. Check if error is caught in try-catch (added in handleSelectCourse)
2. Look at terminal output for "[Library] State updated successfully"
3. If we see "State updated successfully" BEFORE the error, it's in the useEffect
4. If we DON'T see it, the error is in the setState itself (unlikely but possible)

## Test Command
After reloading, click a course filter and check terminal for:
- `[Library] Selected course: <name>`
- `[Library] State updated successfully`  
- `[Library] Simulating fetch for: <name>`
- ERROR message

The ORDER of these logs will tell us exactly where it crashes.
