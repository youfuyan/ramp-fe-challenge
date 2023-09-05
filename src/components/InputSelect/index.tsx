import Downshift from "downshift"
import { useCallback, useState, useRef, useEffect } from "react"
import classNames from "classnames"
import { GetDropdownPositionFn, InputSelectOnChange, InputSelectProps } from "./types"

export function InputSelect<TItem>({
  label,
  defaultValue,
  onChange: consumerOnChange,
  items,
  parseItem,
  isLoading,
  loadingLabel,
}: InputSelectProps<TItem>) {
  const [selectedValue, setSelectedValue] = useState<TItem | null>(defaultValue ?? null)

  // Fixes #1
  // P.S. we can simply use absolute positioning
  // see details in SOLUTIONS.md
  const inputRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement | null>(null) // use mutable ref

  function updateDropdownPosition() {
    if (!inputRef.current || !containerRef.current) {
      return
    }

    const { top, left } = getDropdownPosition(inputRef.current)

    containerRef.current.style.top = `${top}px`
    containerRef.current.style.left = `${left}px`
  }

  useEffect(() => {
    // update dropdown's position when scrolling or resizing
    window.addEventListener("scroll", updateDropdownPosition)
    window.addEventListener("resize", updateDropdownPosition)

    return () => {
      window.removeEventListener("scroll", updateDropdownPosition)
      window.removeEventListener("resize", updateDropdownPosition)
    }
  }, [])

  const onChange = useCallback<InputSelectOnChange<TItem>>(
    (selectedItem) => {
      if (selectedItem === null) {
        return
      }

      consumerOnChange(selectedItem)
      setSelectedValue(selectedItem)
    },
    [consumerOnChange]
  )

  return (
    <Downshift<TItem>
      id="RampSelect"
      onChange={onChange}
      selectedItem={selectedValue}
      itemToString={(item) => (item ? parseItem(item).label : "")}
    >
      {({
        getItemProps,
        getLabelProps,
        getMenuProps,
        isOpen,
        highlightedIndex,
        selectedItem,
        getToggleButtonProps,
        inputValue,
      }) => {
        const toggleProps = getToggleButtonProps()
        const parsedSelectedItem = selectedItem === null ? null : parseItem(selectedItem)

        const { ref: setMenuRef, ...menuProps } = getMenuProps()

        return (
          <div className="RampInputSelect--root">
            <label className="RampText--s RampText--hushed" {...getLabelProps()}>
              {label}
            </label>
            <div className="RampBreak--xs" />
            <div
              className="RampInputSelect--input"
              ref={inputRef}
              onClick={(event) => {
                updateDropdownPosition()
                toggleProps.onClick(event)
              }}
            >
              {inputValue}
            </div>

            <div
              className={classNames("RampInputSelect--dropdown-container", {
                "RampInputSelect--dropdown-container-opened": isOpen,
              })}
              ref={(el) => {
                setMenuRef(el)
                containerRef.current = el
              }}
              {...menuProps}
            >
              {renderItems()}
            </div>
          </div>
        )

        function renderItems() {
          if (!isOpen) {
            return null
          }

          if (isLoading) {
            return <div className="RampInputSelect--dropdown-item">{loadingLabel}...</div>
          }

          if (items.length === 0) {
            return <div className="RampInputSelect--dropdown-item">No items</div>
          }

          return items.map((item, index) => {
            const parsedItem = parseItem(item)
            return (
              <div
                key={parsedItem.value}
                {...getItemProps({
                  key: parsedItem.value,
                  index,
                  item,
                  className: classNames("RampInputSelect--dropdown-item", {
                    "RampInputSelect--dropdown-item-highlighted": highlightedIndex === index,
                    "RampInputSelect--dropdown-item-selected":
                      parsedSelectedItem?.value === parsedItem.value,
                  }),
                })}
              >
                {parsedItem.label}
              </div>
            )
          })
        }
      }}
    </Downshift>
  )
}

const getDropdownPosition: GetDropdownPositionFn = (target) => {
  if (target instanceof Element) {
    const { top, left } = target.getBoundingClientRect()
    return {
      top: top + 63,
      left,
    }
  }

  return { top: 0, left: 0 }
}
