
export const CountdownScreen = ({ count, isCounting, onConfirmStart, onCancel, captureSource }: any) => {
    return (
        <div className="flex flex-col items-center justify-center h-[500px] bg-slate-900/95 backdrop-blur-md text-white font-sans relative overflow-hidden w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-teal-600/20"></div>

            {!isCounting ? (
                <div className="z-10 flex flex-col items-center gap-6">
                    <div className="text-4xl font-bold">Preparado?</div>
                    <div className="text-lg opacity-80 text-center px-8">
                        Você vai gravar: <strong className="text-teal-400">{captureSource === 'tab' ? 'ESTA GUIA' : 'UMA JANELA'}</strong>.
                        <br /><span className="text-sm">Verifique se está na tela correta.</span>
                    </div>
                    <button
                        onClick={onConfirmStart}
                        className="bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 px-8 rounded-full text-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
                    >
                        COMEÇAR (3s)
                    </button>
                    <button onClick={onCancel} className="text-slate-400 underline text-sm mt-4">Cancelar</button>
                </div>
            ) : (
                <div className="z-10 flex flex-col items-center animate-in zoom-in duration-300">
                    <span className="text-sm uppercase tracking-[0.2em] font-bold text-slate-400 mb-4 animate-pulse">Gravando em</span>
                    <span className="text-[8rem] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-2xl">
                        {count}
                    </span>
                </div>
            )}
        </div>
    );
}
