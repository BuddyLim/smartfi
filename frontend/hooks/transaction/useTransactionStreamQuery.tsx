import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BaseURL } from "constants/BaseUrl";
import { USER_ID } from "constants/User";
import { TransactionKey } from "keys/transaction";
import { useEffect, useMemo, useRef } from "react";
import EventSource from "react-native-sse";
import { TransactionProps } from "types/transaction";

export default function useTransactionStreamQuery(
  toggleLoadingState: () => void,
  handleSetJobID: (job_id?: string) => void,
  jobID?: string
) {
  const queryClient = useQueryClient();

  const { data } = useQuery<TransactionProps[]>({
    queryKey: TransactionKey.stream(),
    queryFn: () => {
      const data =
        queryClient.getQueryData<TransactionProps[]>(TransactionKey.stream()) ??
        [];

      return data;
    },
    staleTime: Infinity,
    enabled: !!jobID,
  });

  const queueRef = useRef<TransactionProps[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobID) return;
    const es = new EventSource(`${BaseURL}/transaction/stream/${jobID}`);
    // es.addEventListener("open", () => {
    //   console.log("open");
    // });

    es.addEventListener("error", (event) => {
      console.log(event);
      toggleLoadingState();
      handleSetJobID();
    });
    es.addEventListener("message", (event) => {
      if (event.data === "done") {
        toggleLoadingState();
        handleSetJobID();
        es.close();
      }

      if (event.data !== "done") {
        if (event.data === null) return;
        const data: TransactionProps = JSON.parse(event.data);

        queueRef.current.push(data);

        if (intervalRef.current) return;

        intervalRef.current = setInterval(() => {
          const next = queueRef.current.shift();
          if (next) {
            queryClient.setQueryData<TransactionProps[]>(
              TransactionKey.stream(),
              (prev) => {
                if (!prev) {
                  return [next];
                }

                return [...prev, next];
              }
            );
            queryClient.invalidateQueries({
              queryKey: TransactionKey.all(USER_ID),
            });
          } else {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
          }
        }, 200); // Delay between items (stream-like effect)
      }
    });

    return () => {
      es.removeAllEventListeners();
      es.close();
    };
  }, [jobID, queryClient, toggleLoadingState, handleSetJobID]);

  return useMemo(() => data ?? [], [data]);
}
