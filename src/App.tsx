/**
 * Please check SOLUTIONS.md for details and explains
 */

import { Fragment, useCallback, useEffect, useMemo } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()

  const transactions = useMemo(() => paginatedTransactions?.data ?? transactionsByEmployee ?? null, [
    paginatedTransactions,
    transactionsByEmployee,
  ])

  // Fixes #6
  // whether to show "View More" button or not
  const showViewMore = paginatedTransactions && paginatedTransactions?.nextPage !== null

  // I don't think it's necessary to use `useCallback` here because
  //    1. the change of the callback doesn't affact any componenet, especially the heavy ones
  //    2. this hook brings additional cost to create a callback
  //    3. the dependecies in fact change every time
  //
  // More infomation: https://kentcdodds.com/blog/usememo-and-usecallback
  const loadAllTransactions = useCallback(async () => {
    transactionsByEmployeeUtils.invalidateData()

    await paginatedTransactionsUtils.fetchAll()
  }, [paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      // additional bug: we should also invalidate transactionsByEmployee here!
      transactionsByEmployeeUtils.invalidateData()
      paginatedTransactionsUtils.invalidateData()

      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      // Fixes #5-2
      employeeUtils.fetchAll().then(loadAllTransactions)
    }
  }, [employeeUtils, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={employeeUtils.loading} // Fixes #5-1
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }

            // Fixes #3
            if (newValue.id === EMPTY_EMPLOYEE.id) {
              await loadAllTransactions()
            } else {
              await loadTransactionsByEmployee(newValue.id)
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {showViewMore && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
