import { useSnackbar } from "notistack";
import { useMemo, useCallback } from "react";

const useNotification = () => {
	const { enqueueSnackbar } = useSnackbar();

	const showNotification = useCallback((message, options = {}) => {
		const {
			variant = "default",
			autoHideDuration = 2500,
			...otherOptions
		} = options;

		enqueueSnackbar(message, {
			variant,
			autoHideDuration,
			...otherOptions,
		});
	}, [enqueueSnackbar]);

	return useMemo(() => ({
		showNotification,
		success: (message, options) =>
			showNotification(message, { variant: "success", ...options }),
		error: (message, options) =>
			showNotification(message, { variant: "error", ...options }),
		warning: (message, options) =>
			showNotification(message, { variant: "warning", ...options }),
		info: (message, options) =>
			showNotification(message, { variant: "info", ...options }),
	}), [showNotification]);
};

export default useNotification;
