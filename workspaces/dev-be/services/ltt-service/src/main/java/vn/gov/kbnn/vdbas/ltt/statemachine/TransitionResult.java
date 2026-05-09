package vn.gov.kbnn.vdbas.ltt.statemachine;

/**
 * Ket qua chuyen trang thai.
 *
 * @param success     co thanh cong khong
 * @param targetState trang thai dich (neu thanh cong)
 * @param errorCode   ma loi (neu that bai)
 * @param errorMessage thong bao loi (neu that bai)
 */
public record TransitionResult(
        boolean success,
        String targetState,
        String errorCode,
        String errorMessage
) {
    public static TransitionResult ok(String targetState) {
        return new TransitionResult(true, targetState, null, null);
    }

    public static TransitionResult fail(String errorCode, String errorMessage) {
        return new TransitionResult(false, null, errorCode, errorMessage);
    }
}
