import { useSnackbar } from "notistack";

const useNotification = () => {
	const { enqueueSnackbar } = useSnackbar();

	const showNotification = (message, options = {}) => {
		const {
			variant = "default",
			autoHideDuration = 1000,
			...otherOptions
		} = options;

		enqueueSnackbar(message, {
			variant,
			autoHideDuration,
			...otherOptions,
		});
	};

	return {
		showNotification,
		success: (message, options) =>
			showNotification(message, { variant: "success", ...options }),
		error: (message, options) =>
			showNotification(message, { variant: "error", ...options }),
		warning: (message, options) =>
			showNotification(message, { variant: "warning", ...options }),
		info: (message, options) =>
			showNotification(message, { variant: "info", ...options }),
	};
};

export default useNotification;
