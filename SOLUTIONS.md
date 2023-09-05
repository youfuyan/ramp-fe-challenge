# Solutions for Ramp's frontend interview challenge

## Bug 1

**Related module: `components/InputSelect/index.tsx`**

The simplest (and the best!) solution is to use absolute positioning instead of fixed positioning in the dropdown container, i.e.:

```css
/* index.css */
.RampInputSelect--root {
  position: relative;
}

.RampInputSelect--dropdown-container {
  position: absolute;
}
```

In this way, we don't need to manually calculate and update the dropdown's position. However, **I'm not sure if there is any reason forces us to use fixed positioning (e.g. `z-index` stacking issues)**. So I'll stick to current layout and recalculate the position when the window is scrolling or resizing.

But there is another issue: since `setState` is designed to be asynchronous, the position will not update immediately, and you'll see the dropdown stutters when scrolling. So we need to either use `flushSync()` to fire a synchronous update, or update the styles directly instead of using the `useState()` hook.

Anyway, I'd suggest using absolute positioning for the dropdown when possible.

## Bug 2

**Related module: `components/InputCheckBox/index.tsx`**

The issue here is that the `label` is not linked with the `input`. We can either add a `for`(`htmlFor` in react) attribute to the `label` element or wrap the `input` with the `label` (i.e. `<label><input /></label>`).

## Bug 3

**Related module: `App.tsx`**

The issue here is that we didn't handle the case where the selected value is `All Transactions`. Therefore, in the `onChange` handler, we need to load all transactions if `newValue.id === EMPTY_EMPLOYEE.id`, otherwise load the selected transaction.

## Bug 4

**Related module: `hooks/usePaginatedTransactions.ts`**

The issue here is that we replaced the old data with the new data. In order to show all the data, we need to concatenate the old ones with the new ones: `[...old, ...new]`.

## Bug 5

**Related module: `App.tsx`**

We don't actually need the `isLoading` flag here because there is a `loading` state in the `useEmployees()` hook. Also, since we only need to load employees once, we can move `employeeUtils.fetchAll()` into the initial `useEffect()` block.

## Bug 6

**Related module: `App.tsx`**

Here we can add a `showViewMore` flag/state indicating whether to show the button. We only show the button when the following conditions are all satisfied:

1. paginated data has been loaded (implies "All Transactions" option is selected), and
2. there are more pages to load

## Bug 7

**Related module: `components/Transactions/index.tsx`**

We should call `clearCache()` after making changes.

## Additional Bug #1: previous transactions are not removed when switching employee

**How to reproduce:**

1. Click on the **Filter by employee** select to open the options dropdown
2. Select an employee from the list _(E.g. James Smith)_
3. Click on the **Filter by employee** select to open the options dropdown
4. Select another employee from the list _(E.g. Mary Miller)_
5. Verify values

**Expected:** Between step 4 and 5, previous result should be removed and "Loading..." should appear until the new data is fetched

**Actual:** Between step 4 and 5, previous result kept showing until the new data is fetched

**Fix:** invalidate `transactionsByEmployee` when switching employee

## Additional Bug #2: wrong transactions when switching employee fast

**How to reproduce:**

1. Click on the **Filter by employee** select to open the options dropdown
2. Select an employee from the list _(E.g. James Smith)_
3. Wait until the data is fetched
4. Click on the **Filter by employee** and select another employee from the list _(E.g. Mary Miller)_
5. Quickly switch back to previous employee before the data is fetched
6. Verify values

**Expected:** In step 6, the latest result _(James Smith)_ should be shown

**Actual:** In step 6, the previous result _(Mary Miller)_ was shown

**Fix:** add a `shouldAbort` flag (or use the `AbortController`) in `usePaginatedTransactions` and `useTransactionsByEmployee` and set the flag to `true` if `invalidateData()` is called. Discard the results if `shouldAbort === true`. However, this implementation is not possible with the `useCallback()` hook since all the fetch functions are sharing the same flag, and we can't abort a specific fetch.
