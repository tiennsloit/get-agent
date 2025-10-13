// composables/useConfirmation.ts
import { useConfirmDialog } from '@vueuse/core';
import { ref, h, render } from 'vue';

const dialogContent = ref({
    title: 'Are you sure?',
    message: 'Please confirm your action.',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
});

const { isRevealed, confirm, cancel, reveal } = useConfirmDialog();

function createDialog() {
    const container = document.createElement('div');

    const dialog = h(
        'div',
        {
            class: 'fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50',
            onClick: (e: MouseEvent) => {
                if (e.target === e.currentTarget) { cancel(); }
            }
        },
        [
            h(
                'div',
                {
                    class: 'bg-black border border-gray rounded-lg p-4 max-w-sm w-full',
                },
                [
                    h('h2', { class: 'text-lg font-semibold mb-4' }, dialogContent.value.title),
                    h('p', { class: 'mb-4' }, dialogContent.value.message),
                    h(
                        'div',
                        { class: 'flex justify-end gap-3' },
                        [
                            h(
                                'button',
                                {
                                    onClick: cancel,
                                    class: 'font-semibold cursor-pointer px-4 py-2 text-gray-500 hover:text-gray-700',
                                },
                                dialogContent.value.cancelText
                            ),
                            h(
                                'button',
                                {
                                    onClick: confirm,
                                    class: 'font-semibold cursor-pointer px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors',
                                },
                                dialogContent.value.confirmText
                            ),
                        ]
                    ),
                ]
            ),
        ]
    );

    render(dialog, container);
    document.body.appendChild(container);

    return {
        destroy: () => {
            render(null, container);
            document.body.removeChild(container);
        }
    };
}

export function useConfirmation() {
    let dialogInstance: ReturnType<typeof createDialog> | null = null;

    const confirmAction = async (options?: {
        title?: string;
        message?: string;
        confirmText?: string;
        cancelText?: string;
    }) => {
        if (options) { dialogContent.value = { ...dialogContent.value, ...options }; }

        dialogInstance = createDialog();
        const { isCanceled } = await reveal();

        dialogInstance?.destroy();
        dialogInstance = null;

        return !isCanceled;
    };

    return { confirm: confirmAction };
}