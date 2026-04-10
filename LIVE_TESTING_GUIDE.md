# Kubernetes GUI Manager - Live Testing Guide

## Overview
This guide provides step-by-step instructions for testing the Kubernetes GUI Manager after deployment to Vercel.

**Live URL**: `https://kuberneties-53ol.vercel.app/`

---

## Pre-Testing Checklist

Before testing, ensure:
- [ ] Deployment is complete (wait 2-3 minutes after git push)
- [ ] URL is accessible in browser
- [ ] No browser console errors (F12 → Console)

---

## Test Cases

### Test 1: Page Load Verification
**Objective**: Verify the application loads correctly

**Steps**:
1. Open browser (Chrome/Firefox/Edge)
2. Navigate to: `https://kuberneties-53ol.vercel.app/`
3. Wait for page to fully load (2-3 seconds)

**Expected Results**:
- [ ] Page title shows: "Kubernetes GUI Manager"
- [ ] "Connected" badge appears (green)
- [ ] "Refresh" button is visible (blue)
- [ ] Navigation tabs visible: Pods, Deployments, Services, Logs, Monitor
- [ ] "Pods Management" section is displayed by default
- [ ] "Create Pod" button is visible (green)
- [ ] No error messages in browser console

**Success Criteria**: All elements load without errors

---

### Test 2: Navigation Tabs
**Objective**: Verify all tabs are clickable and display correct content

**Steps**:
1. Click on "Deployments" tab
2. Click on "Services" tab
3. Click on "Logs" tab
4. Click on "Monitor" tab
5. Click back on "Pods" tab

**Expected Results**:
- [ ] Each tab click changes the active tab (blue background)
- [ ] "Deployments Management" section appears when clicking Deployments
- [ ] "Services Management" section appears when clicking Services
- [ ] "Log Viewer" section appears when clicking Logs
- [ ] "Cluster Monitoring" section appears when clicking Monitor
- [ ] Smooth transitions between tabs

**Success Criteria**: All tabs switch correctly without page reload

---

### Test 3: Create Pod Functionality
**Objective**: Verify pod creation workflow

**Steps**:
1. Ensure you're on the "Pods" tab
2. Click the green "Create Pod" button
3. In the modal that opens:
   - Enter Pod Name: `test-pod`
   - Enter Container Image: `nginx:latest`
   - Select Namespace: `default`
   - Enter Port: `80`
4. Click the "Confirm" button

**Expected Results**:
- [ ] Modal opens with form fields
- [ ] Form has fields: Pod Name, Container Image, Namespace, Port
- [ ] All fields accept input
- [ ] After clicking Confirm, modal closes
- [ ] Alert shows: "Creating pod: test-pod with image: nginx:latest in namespace: default"
- [ ] New pod appears in the pods table
- [ ] Pod shows status: "Running" (green badge)
- [ ] Pod shows Ready: "1/1"
- [ ] Pod shows Age: "0s"

**Success Criteria**: Pod is created and appears in the table

---

### Test 4: Pod Actions (Describe, Restart, Delete)
**Objective**: Test pod management actions

**Steps**:
1. Create a test pod first (follow Test 3)
2. In the pod row, click the **info icon** (describe button)
3. Click the **restart icon** (restart button)
4. Click the **delete icon** (trash can - delete button)

**Expected Results**:
- [ ] Clicking info icon shows alert: "Pod [name] described"
- [ ] Clicking restart icon shows alert: "Pod [name] restarted"
- [ ] Clicking delete icon:
  - Shows alert: "Pod [name] deleted"
  - Removes the pod row from the table

**Success Criteria**: All pod actions work correctly

---

### Test 5: Namespace Selection
**Objective**: Verify namespace filtering

**Steps**:
1. Look for the "All Namespaces" dropdown
2. Click on the dropdown
3. Check available namespace options

**Expected Results**:
- [ ] Dropdown opens showing options
- [ ] Default option: "All Namespaces"
- [ ] Options include: default, development, production

**Success Criteria**: Namespace dropdown is functional

---

### Test 6: Modal System
**Objective**: Verify modal functionality

**Steps**:
1. Click "Create Pod" button
2. When modal opens, click "Cancel" button
3. Click "Create Pod" again
4. Fill in form and click "Confirm"

**Expected Results**:
- [ ] Modal opens with dark background overlay
- [ ] Modal has title: "Create Pod"
- [ ] Modal has form fields
- [ ] Clicking "Cancel" closes modal without action
- [ ] Clicking "Confirm" processes the action and closes modal

**Success Criteria**: Modal opens and closes correctly

---

### Test 7: Responsive Design
**Objective**: Verify UI works on different screen sizes

**Steps**:
1. Open the application on desktop/laptop
2. Resize browser window to tablet size
3. Resize browser window to mobile size

**Expected Results**:
- [ ] Layout adjusts properly
- [ ] Navigation tabs remain accessible
- [ ] Create Pod button remains visible
- [ ] Table content is scrollable
- [ ] Modal fits screen properly

**Success Criteria**: UI is responsive across devices

---

### Test 8: Real-time Updates
**Objective**: Verify data updates in real-time

**Steps**:
1. Create multiple pods quickly
2. Watch the "Total Pods" counter in Monitor tab
3. Delete a pod
4. Check if counter updates

**Expected Results**:
- [ ] Created pods appear immediately in table
- [ ] Monitor tab shows updated pod count
- [ ] Deleted pods are removed immediately

**Success Criteria**: UI reflects changes in real-time

---

## Error Testing

### Test 9: Form Validation
**Objective**: Test error handling for invalid inputs

**Steps**:
1. Click "Create Pod"
2. Leave Pod Name empty
3. Leave Container Image empty
4. Click "Confirm"

**Expected Results**:
- [ ] Alert shows: "Pod name and image are required"
- [ ] Modal stays open
- [ ] User can fill in missing fields and retry

**Success Criteria**: Form validation prevents empty submissions

---

### Test 10: Browser Console Check
**Objective**: Verify no JavaScript errors

**Steps**:
1. Open application
2. Press F12 (open developer tools)
3. Go to Console tab
4. Perform various actions (click tabs, create pod, etc.)

**Expected Results**:
- [ ] No red error messages in console
- [ ] No "undefined" errors
- [ ] No "function not found" errors
- [ ] Optional: "Inline functions loaded successfully" message appears

**Success Criteria**: Console is free of errors

---

## Performance Testing

### Test 11: Load Time
**Objective**: Verify fast loading

**Steps**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Navigate to application URL
3. Time how long page takes to load

**Expected Results**:
- [ ] Page loads within 3-5 seconds
- [ ] All elements visible quickly
- [ ] No long loading spinners

**Success Criteria**: Application loads fast

---

## Known Limitations (Demo Mode)

Since this is a **frontend-only deployment** (no backend server):

1. **Mock Data Only**: All pods are created in memory, not in real Kubernetes
2. **No Persistence**: Refreshing the page clears all created pods
3. **No Real kubectl**: Commands are simulated, not actually run
4. **WebSocket Limitations**: Real-time features work via mock backend

**For Real Kubernetes Integration**:
- Deploy with full backend server
- Requires Node.js server with kubectl access
- Would need hosting that supports Node.js (not Vercel static)

---

## Troubleshooting

### Issue: Page shows "ERROR: createPod function does NOT exist"
**Solution**: 
- Wait 2-3 minutes for deployment to complete
- Hard refresh browser (Ctrl+F5)
- Clear browser cache

### Issue: Modal doesn't open
**Solution**:
- Check browser console for JavaScript errors
- Verify no ad-blockers are blocking scripts
- Try different browser

### Issue: Created pods don't appear in table
**Solution**:
- Check if table exists in DOM
- Verify no JavaScript errors during creation
- Try creating pod again

### Issue: Slow loading
**Solution**:
- Check internet connection
- Clear browser cache
- Try accessing from different network

---

## Success Criteria Summary

✅ **Application is fully functional if**:
1. Page loads without errors
2. All tabs are clickable and switch content
3. Create Pod button opens modal with form
4. Form validation works
5. Pods are created and appear in table
6. Pod actions (describe, restart, delete) work
7. No JavaScript errors in console
8. UI is responsive

---

## Contact & Support

If issues persist:
1. Check GitHub repository: `https://github.com/Srk-1974/Kuberneties`
2. Verify latest code is deployed
3. Check Vercel deployment logs
4. Clear browser cache and retry

---

**Last Updated**: April 2026
**Version**: 1.0
**Deployment Platform**: Vercel (Static)
