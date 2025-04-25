"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "../ui/dialog";
import { TransactionForm } from "./components/TransactionForm";
import { UpsertTransactionDialogProps, TransactionFormValues } from "./types";
import { TransactionType, TransactionPaymentMethod } from "@prisma/client";
import { upsertTransaction } from "../../_actions/upsert-transaction";

export const UpsertTransactionDialog = ({
  isOpen,
  defaultValues,
  transactionId,
  setIsOpen,
  onSuccess
}: UpsertTransactionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Valores padrão para o formulário
  const initialValues: TransactionFormValues = defaultValues || {
    amount: 50,
    category: "OTHER" as any, // Ajustar conforme os tipos corretos do seu sistema
    date: new Date(),
    name: "",
    paymentMethod: TransactionPaymentMethod.CASH,
    type: TransactionType.EXPENSE,
  };

  const handleSubmit = async (data: TransactionFormValues) => {
    try {
      setIsSubmitting(true);
      await upsertTransaction({ ...data, id: transactionId });
      
      handleClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("[UPSERT_TRANSACTION_ERROR]", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const isUpdate = Boolean(transactionId);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
      }}
    >
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? "Atualizar" : "Criar"} transação
          </DialogTitle>
          <DialogDescription>Insira as informações abaixo</DialogDescription>
        </DialogHeader>

        <TransactionForm 
          defaultValues={initialValues}
          transactionId={transactionId}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}; 