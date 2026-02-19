"use client";

import { useState } from "react";
import { Plus, Layers, MapPin, ChevronDown, ChevronUp, X } from "lucide-react";
import Link from "next/link";
import SegmentoForm from "@/components/geolocalizacao/SegmentoForm";
import { motion, AnimatePresence } from "framer-motion";

type Segmento = {
  id: string;
  uuid: string;
  nome: string;
  kmInicial: number;
  kmFinal: number;
  rodovia: {
    id: string;
    nome: string;
    codigo: string | null;
  };
};

type Props = {
  project: string;
  initialSegmentos: Segmento[];
};

export default function SegmentosAdminClient({ project, initialSegmentos }: Props) {
  const [segmentos, setSegmentos] = useState<Segmento[]>(initialSegmentos);
  const [showForm, setShowForm] = useState(false);

  const handleSuccess = () => {
    // Recarregar a página para atualizar a lista
    window.location.reload();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Gerenciar Segmentos Homogêneos
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Visualize e gerencie os segmentos do projeto
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            showForm
              ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
        >
          {showForm ? (
            <>
              <X className="w-5 h-5" />
              Fechar Formulário
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Cadastrar Segmento
            </>
          )}
        </button>
      </div>

      {/* Collapsible Form Section */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-500" />
                Novo Segmento Homogêneo
              </h3>
              <SegmentoForm onSuccess={handleSuccess} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Segmentos List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                Nome
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                Rodovia
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                KM Inicial
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                KM Final
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                Extensão
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {segmentos.map((segmento) => {
              const extensao = segmento.kmFinal - segmento.kmInicial;
              return (
                <tr key={segmento.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Layers className="w-5 h-5 text-emerald-500" />
                      <span className="text-slate-900 dark:text-white font-medium">
                        {segmento.nome}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {segmento.rodovia.nome}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono">
                    KM {segmento.kmInicial.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono">
                    KM {segmento.kmFinal.toFixed(1)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-blue-600 dark:text-blue-400 font-mono">
                      {extensao.toFixed(2)} km
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/${project}/admin/segmentos/${segmento.uuid}`}
                      className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              );
            })}
            {segmentos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 mb-2">
                    Nenhum segmento cadastrado
                  </p>
                  <p className="text-slate-400 dark:text-slate-600 text-sm">
                    Clique em "Cadastrar Segmento" para adicionar o primeiro
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
