import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Primary color from tailwind.config.ts
const PRIMARY_COLOR = '#D97757';

export const confirmAction = async (
    title: string,
    text: string,
    confirmButtonText = 'Ya, Lanjutkan'
) => {
    return MySwal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: PRIMARY_COLOR,
        cancelButtonColor: '#78716C', // warmgray-500
        confirmButtonText,
        cancelButtonText: 'Batal',
        reverseButtons: true, // Often better UX to have primary action on the right or swapped depending on OS, but this is a web app preference.
    });
};

export const showSuccess = (title: string, text?: string) => {
    return MySwal.fire({
        title,
        text,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        confirmButtonColor: PRIMARY_COLOR,
    });
};

export const showError = (title: string, text?: string) => {
    return MySwal.fire({
        title,
        text,
        icon: 'error',
        confirmButtonColor: PRIMARY_COLOR,
    });
};

export default MySwal;
