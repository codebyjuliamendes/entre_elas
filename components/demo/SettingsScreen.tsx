"use client";
import { useRef, useState } from "react";
import {
  Download,
  Upload,
  Trash2,
  ShieldCheck,
  Database,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import {
  exportarBackup,
  importarBackup,
  limparDadosLocais,
  useDemo,
} from "@/lib/demo/store";
import { baixarArquivo } from "@/lib/demo/calendario";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
export function SettingsScreen() {
  const s = useDemo();
  const arquivo = useRef<HTMLInputElement>(null);
  const [limpar, setLimpar] = useState(false);
  const [backup, setBackup] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">Sua experiência, suas escolhas</span>
        <h1 className="page-title">
          Um espaço
          <br />
          sob seu controle.
        </h1>
        <p className="page-subtitle">
          Guarde suas trocas, leve uma cópia com você e escolha quando
          recomeçar.
        </p>
      </div>
      <div className="settings-grid">
        <section className="settings-card">
          <span className="icon-tile lilac">
            <Database size={23} />
          </span>
          <h2>Seus dados de apresentação</h2>
          <p>
            Esta versão usa pessoas fictícias e salva seu progresso neste
            navegador. Não há sincronização com outros dispositivos ou
            publicação em serviços externos.
          </p>
          <div className="data-summary">
            <span>
              <strong>{s.convites.length}</strong> encontros
            </span>
            <span>
              <strong>{s.publicacoes.length}</strong> aprendizados
            </span>
            <span>
              <strong>{s.posts.length}</strong> publicações
            </span>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              baixarArquivo(
                "entre-elas-backup.json",
                exportarBackup(),
                "application/json",
              );
              toast.success(
                "Backup exportado. Guarde o arquivo em um local de sua confiança.",
              );
            }}
          >
            <Download size={15} />
            Exportar meu progresso
          </Button>
        </section>
        <section className="settings-card">
          <span className="icon-tile mint">
            <ShieldCheck size={23} />
          </span>
          <h2>Continue de onde parou</h2>
          <p>
            Importe um backup do Entre Elas. Você poderá confirmar antes de
            substituir os dados atuais. Arquivos de até 10 MB.
          </p>
          <input
            ref={arquivo}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            aria-label="Arquivo de backup"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                if (f.size > 10_000_000)
                  throw new Error("O arquivo deve ter até 10 MB.");
                const texto = await f.text();
                const dados = JSON.parse(texto);
                if (dados.aplicativo !== "Entre Elas" || !dados.dados)
                  throw new Error("Escolha um backup válido do Entre Elas.");
                setBackup(texto);
              } catch {
                toast.error(
                  "Não conseguimos ler esse backup. Use um arquivo JSON do Entre Elas de até 10 MB.",
                );
              } finally {
                e.target.value = "";
              }
            }}
          />
          <Button variant="outline" onClick={() => arquivo.current?.click()}>
            <Upload size={15} />
            Importar um backup
          </Button>
        </section>
        <section className="settings-card">
          <span className="icon-tile peach">
            <Smartphone size={23} />
          </span>
          <h2>Entre Elas sempre por perto</h2>
          <p>
            Em um navegador compatível, use “Instalar aplicativo” ou “Adicionar
            à tela de início”. A instalação depende do navegador e de uma
            conexão HTTPS.
          </p>
          <div className="privacy-note">
            <CheckCircle2 size={15} />
            <span>
              O modo de apresentação não acessa sua câmera nem seu microfone.
              Conversas simuladas não são enviadas à IA.
            </span>
          </div>
        </section>
        <section className="settings-card danger-zone">
          <h2>Começar uma nova história</h2>
          <p>
            Apague os dados desta apresentação e volte ao ponto de partida.
            Exporte um backup antes se quiser preservar os aprendizados.
          </p>
          <Button variant="outline" onClick={() => setLimpar(true)}>
            <Trash2 size={15} />
            Apagar dados deste dispositivo
          </Button>
        </section>
      </div>
      <Dialog
        open={limpar || !!backup}
        onOpenChange={(open) => {
          if (!open) {
            setLimpar(false);
            setBackup(null);
          }
        }}
      >
        <DialogContent>
          <DialogTitle>
            {limpar ? "Recomeçar do zero?" : "Substituir seu progresso?"}
          </DialogTitle>
          <DialogDescription>
            {limpar
              ? "Encontros, publicações, comentários, mensagens e preferências desta apresentação serão apagados deste navegador."
              : "Os dados atuais serão substituídos pelo backup selecionado. Um arquivo inválido será recusado e não alterará seu progresso."}
          </DialogDescription>
          <Button
            className="full-width"
            variant={limpar ? "danger" : "default"}
            disabled={ocupado}
            onClick={() => {
              setOcupado(true);
              try {
                if (limpar) limparDadosLocais();
                else if (backup) importarBackup(backup);
                setLimpar(false);
                setBackup(null);
                toast.success(
                  limpar
                    ? "Apresentação reiniciada."
                    : "Backup importado com sucesso.",
                );
              } catch {
                toast.error(
                  "O backup não é compatível. Seus dados atuais foram preservados.",
                );
              } finally {
                setOcupado(false);
              }
            }}
          >
            {limpar ? "Sim, apagar dados locais" : "Confirmar importação"}
          </Button>
          <Button
            variant="ghost"
            className="full-width"
            style={{ marginTop: 8 }}
            onClick={() => {
              setLimpar(false);
              setBackup(null);
            }}
          >
            Cancelar
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
