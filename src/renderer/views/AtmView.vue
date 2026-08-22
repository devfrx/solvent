<script setup lang="ts">
import { storeToRefs } from 'pinia'

import AtmPanel from '@renderer/components/atm/AtmPanel.vue'
import BankCard3d from '@renderer/components/atm/BankCard3d.vue'
import OperationList from '@renderer/components/ledger/OperationList.vue'
import VaultAlarm from '@renderer/components/vault/VaultAlarm.vue'
import { traceabilityKey, useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'
import UiLabel from '@renderer/ui/UiLabel.vue'
import UiPanel from '@renderer/ui/UiPanel.vue'
import UiText from '@renderer/ui/UiText.vue'

/**
 * La pagina del bancomat, come la disegna l'artboard `ATM` del canvas: **due colonne**, e la
 * divisione non è estetica — a sinistra si **fa**, a destra si **guarda**. È la stessa distinzione
 * che la colonna della navigazione fa un piano sopra (D026), portata dentro una schermata.
 *
 * Nasce con [D033](../../../docs/delega/D033-il-bancomat-e-una-pagina.md), che separa il bancomat
 * dal cruscotto ([ADR 0040](../../../docs/adr/0040-il-bancomat-e-il-cruscotto-sono-due-pagine.md)).
 *
 * **La griglia sta qui e non nel kit**, ed è R16 con l'[ADR 0030](../../../docs/adr/0030-il-telaio-e-una-forma-non-un-contenitore.md):
 * il telaio è una forma, non un contenitore, e la geometria è ammessa nella pagina — che è l'unico
 * posto che sa quante colonne servono a **questo** contenuto.
 *
 * L'allarme del caveau sta a sinistra e non a destra, e non è un dettaglio: dice che il muro è
 * stato toccato, e ciò che si fa dopo averlo letto è depositare. Vive nella cartella del caveau
 * (ADR 0033) e compare qui perché il muro si incontra **giocando**, non amministrando (D026).
 *
 * `CashPanel` non esiste più. Diceva quanti contanti ci sono e quanto ce ne sta ancora, e nel
 * disegno del canvas quelle due cose sono il lato `CONTANTI` del blocco `DA ⇄ A`: tenerlo sarebbe
 * lo stesso numero in due punti della stessa schermata.
 */

/**
 * `recentOperations` e non `operations`: il registro intero è della schermata Statistiche, e
 * quante righe siano «poche» lo decide un selettore dello store, non questa pagina (R05).
 */
const { cardCapacity, atmFeeRates, recentOperations } = storeToRefs(useGameStore())
const { text, money, rate } = useTranslator()
</script>

<template>
  <div class="columns">
    <section class="doing">
      <VaultAlarm />
      <AtmPanel />
    </section>

    <section class="watching">
      <UiPanel :title="text('atm.card.title')">
        <BankCard3d
          :capacity="cardCapacity === null ? text('pool.unlimited') : money(cardCapacity)"
          :fee="
            text('atm.fee.rates', {
              deposit: rate(atmFeeRates.deposit),
              withdraw: rate(atmFeeRates.withdraw)
            })
          "
          :traceability="text(traceabilityKey('card'))"
        />

        <p class="cash">
          <span class="mark" aria-hidden="true"></span>
          <UiLabel tone="cash">{{ text('pool.cash') }}</UiLabel>
          <UiText size="xs" class="note">{{ text('atm.cash.note') }}</UiText>
        </p>
      </UiPanel>

      <UiPanel :title="text('atm.recent.title')">
        <OperationList :operations="recentOperations" />
      </UiPanel>
    </section>
  </div>
</template>

<style scoped>
/*
 * Sette colonne a sinistra e cinque a destra, come il canvas. Sotto la soglia diventano una, e
 * l'operazione resta **prima** — è ciò per cui questa pagina si apre, e nel documento sta già
 * davanti: non serve riordinare niente, serve smettere di affiancare.
 *
 * Una `@media` sola, e non due: due soglie sono due punti in cui la pagina può contraddirsi, e a
 * questa larghezza non c'è una terza forma da descrivere.
 *
 * **La soglia è misurata, non scelta.** La carta è un oggetto di 290px che non si stringe (P5), e
 * il riquadro che la contiene ne vuole 330 fra bordi e margini: sotto i 70rem di finestra la
 * colonna destra scende sotto quella cifra. Una soglia più bassa non produrrebbe due colonne
 * strette — produrrebbe una carta schiacciata, che è la cosa che questa pagina non può permettersi.
 */
.columns {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--space-5);
  align-items: start;
}

.doing {
  grid-column: span 7;
}

.watching {
  grid-column: span 5;
}

.doing,
.watching {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  min-width: 0;
}

@media (width <= 70rem) {
  .doing,
  .watching {
    grid-column: 1 / -1;
  }
}

/* La nota sui contanti: sta sotto la carta perché è ciò che la carta **non** è. */
.cash {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-5) 0 0;
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-line-soft);
}

.mark {
  flex: 0 0 auto;
  width: var(--space-3);
  height: var(--space-3);
  border-radius: var(--radius-xs);
  background: var(--color-cash);
}

.note {
  flex: 1;
}
</style>
