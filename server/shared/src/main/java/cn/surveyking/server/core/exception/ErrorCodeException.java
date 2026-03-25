package cn.surveyking.server.core.exception;

import cn.surveyking.server.core.constant.ErrorCode;

/**
 * 定义异常码消息，方便后面前端进行国际化
 *
 * @author javahuang
 * @date 2022/2/23
 */
public class ErrorCodeException extends RuntimeException {

	private final ErrorCode errorCode;

	public ErrorCodeException(ErrorCode errorCode) {
		super(errorCode.message);
		this.errorCode = errorCode;
	}

	public ErrorCodeException(ErrorCode errorCode, String message) {
		super(message);
		this.errorCode = errorCode;
	}

	public ErrorCodeException(ErrorCode errorCode, Throwable cause) {
		this(errorCode, cause == null ? errorCode.message : cause.getMessage(), cause);
	}

	public ErrorCodeException(ErrorCode errorCode, String message, Throwable cause) {
		super(message, cause);
		this.errorCode = errorCode;
	}

	public ErrorCode getErrorCode() {
		return errorCode;
	}

}
