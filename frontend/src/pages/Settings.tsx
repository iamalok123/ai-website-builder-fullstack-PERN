import { AccountSettingsCards, ChangePasswordCard, DeleteAccountCard } from "@daveyplate/better-auth-ui"

const Settings = () => {
    return (
        <div className="w-full p-4 flex flex-col gap-7 py-8 justify-center items-center min-h-[90vh]">
            <AccountSettingsCards
                classNames={{
                    card: {
                        base: "bg-black/10 ring ring-indigo-950 max-w-2xl mx-auto",
                        footer: "bg-black/10 ring ring-indigo-950"
                    }
                }}
            />

            <div className="w-full">
                <ChangePasswordCard
                    classNames={{
                        base: "bg-black/10 ring ring-indigo-950 max-w-2xl mx-auto",
                        footer: "bg-black/10 ring ring-indigo-950"
                    }}
                />
            </div>

            <div className="w-full">
                <DeleteAccountCard
                    classNames={{
                        base: "bg-black/10 ring ring-indigo-950 max-w-2xl mx-auto",
                    }}
                />
            </div>
        </div>
    )
}

export default Settings