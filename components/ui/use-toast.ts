"use client"

import * as React from "react"

import type { ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToastsMap = Map<
  string,
  {
    toast: ToastProps
    timeout: ReturnType<typeof setTimeout> | null
  }
>

type Action =
  | {
      type: "ADD_TOAST"
      toast: ToastProps
    }
  | {
      type: "UPDATE_TOAST"
      toast: ToastProps
    }
  | {
      type: "DISMISS_TOAST"
      toastId?: ToastProps["id"]
    }
  | {
      type: "REMOVE_TOAST"
      toastId?: ToastProps["id"]
    }

interface State {
  toasts: ToastProps[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      }

    case "DISMISS_TOAST":
      const { toastId } = action
      // ! Side effects !
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === toastId ? { ...t, open: false } : t)),
      }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: ((state: State) => void)[] = []

let state: State = {
  toasts: [],
}

function dispatch(action: Action) {
  state = reducer(state, action)
  listeners.forEach((listener) => listener(state))
}

type Toast = Pick<ToastProps, "id"> &
  (
    | {
        title?: string
        description?: string
        variant?: "default" | "destructive"
      }
    | {
        render: (props: { id: string }) => React.ReactNode
      }
  )

function createToast(props: ToastProps) {
  const { id, ...rest } = props
  return {
    id,
    open: true,
    onOpenChange: (open: boolean) => {
      if (!open) {
        dispatch({
          type: "DISMISS_TOAST",
          toastId: id,
        })
      }
    },
    ...rest,
  }
}

function useToast() {
  const [toasts, setToasts] = React.useState(state.toasts)

  React.useEffect(() => {
    const listener = (newState: State) => {
      setToasts(newState.toasts)
    }

    listeners.push(listener)
    return () => {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    toasts,
    toast: React.useCallback((props: Toast) => {
      const id = props.id || crypto.randomUUID()

      dispatch({
        type: "ADD_TOAST",
        toast: createToast({
          id,
          ...props,
        }),
      })

      return {
        id: id,
        dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
        update: (props: ToastProps) => dispatch({ type: "UPDATE_TOAST", toast: { id, ...props } }),
      }
    }, []),
  }
}

export { useToast, reducer as toastReducer }
